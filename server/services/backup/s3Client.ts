import crypto from 'node:crypto';
import { type S3Config } from './types.js';

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = hmacSha256('AWS4' + key, dateStamp);
  const kRegion = hmacSha256(kDate, regionName);
  const kService = hmacSha256(kRegion, serviceName);
  return hmacSha256(kService, 'aws4_request');
}

export class S3Client {
  private readonly config: S3Config;

  constructor(config: S3Config) {
    this.config = config;
  }

  private getEndpointUrl(key: string): { url: URL; hostHeader: string } {
    let rawEndpoint = this.config.endpoint?.trim();
    const bucket = this.config.bucket;
    const cleanKey = key.replace(/^\/+/, '');

    if (rawEndpoint) {
      if (!/^https?:\/\//i.test(rawEndpoint)) {
        rawEndpoint = `https://${rawEndpoint}`;
      }
      const baseUrl = new URL(rawEndpoint);
      if (this.config.forcePathStyle) {
        // Path style: https://endpoint/bucket/key
        const fullPath = `/${bucket}/${cleanKey}`.replace(/\/+/g, '/');
        const url = new URL(fullPath, baseUrl);
        return { url, hostHeader: baseUrl.host };
      } else {
        // Virtual host style: https://bucket.endpoint/key
        const host = `${bucket}.${baseUrl.host}`;
        const url = new URL(`/${cleanKey}`, `${baseUrl.protocol}//${host}`);
        return { url, hostHeader: host };
      }
    } else {
      // Standard AWS S3 endpoint
      const region = this.config.region || 'us-east-1';
      const host = region === 'us-east-1' ? `${bucket}.s3.amazonaws.com` : `${bucket}.s3.${region}.amazonaws.com`;
      const url = new URL(`https://${host}/${cleanKey}`);
      return { url, hostHeader: host };
    }
  }

  private signRequest(
    method: string,
    url: URL,
    hostHeader: string,
    payload: Buffer,
    contentType = 'application/octet-stream',
    extraHeaders: Record<string, string> = {}
  ): Record<string, string> {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);
    const region = this.config.region || 'us-east-1';
    const payloadHash = sha256Hex(payload);

    const headers: Record<string, string> = {
      'host': hostHeader,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate
    };
    if (contentType) {
      headers['content-type'] = contentType;
    }
    for (const [key, value] of Object.entries(extraHeaders)) headers[key.toLowerCase()] = value;

    const sortedHeaderKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedHeaderKeys.map(k => `${k}:${headers[k]}\n`).join('');
    const signedHeaders = sortedHeaderKeys.join(';');

    const canonicalUri = encodeURI(url.pathname) || '/';
    const canonicalQuery = Array.from(url.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const canonicalRequest = [
      method.toUpperCase(),
      canonicalUri,
      canonicalQuery,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest)
    ].join('\n');

    const signingKey = getSignatureKey(this.config.secretAccessKey, dateStamp, region, 's3');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      ...headers,
      'Authorization': authorizationHeader
    };
  }

  async putObject(key: string, data: Buffer, contentType = 'application/octet-stream', extraHeaders: Record<string, string> = {}): Promise<void> {
    const { url, hostHeader } = this.getEndpointUrl(key);
    const headers = this.signRequest('PUT', url, hostHeader, data, contentType, extraHeaders);

    const res = await fetch(url.toString(), {
      method: 'PUT',
      headers,
      body: new Uint8Array(data)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`S3 PUT object failed with HTTP ${res.status}: ${errText || res.statusText}`);
    }
  }

  async getObject(key: string): Promise<Buffer | null> {
    const { url, hostHeader } = this.getEndpointUrl(key);
    const headers = this.signRequest('GET', url, hostHeader, Buffer.alloc(0), '');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`S3 GET object failed with HTTP ${res.status}: ${errText || res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async headObject(key: string): Promise<{ size: number; etag?: string } | null> {
    const { url, hostHeader } = this.getEndpointUrl(key);
    const headers = this.signRequest('HEAD', url, hostHeader, Buffer.alloc(0), '');

    const res = await fetch(url.toString(), {
      method: 'HEAD',
      headers
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`S3 HEAD object failed with HTTP ${res.status}: ${res.statusText}`);
    }

    const contentLength = Number(res.headers.get('content-length') || 0);
    const etag = res.headers.get('etag')?.replace(/"/g, '') || undefined;
    return { size: contentLength, etag };
  }

  async deleteObject(key: string): Promise<boolean> {
    const { url, hostHeader } = this.getEndpointUrl(key);
    const headers = this.signRequest('DELETE', url, hostHeader, Buffer.alloc(0), '');

    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers
    });

    return res.ok || res.status === 404;
  }

  async listObjects(prefix = ''): Promise<{ key: string; size: number; lastModified: number }[]> {
    const { url, hostHeader } = this.getEndpointUrl('');
    url.searchParams.set('list-type', '2');
    if (prefix) {
      url.searchParams.set('prefix', prefix);
    }
    const headers = this.signRequest('GET', url, hostHeader, Buffer.alloc(0), '');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`S3 list objects failed with HTTP ${res.status}: ${errText || res.statusText}`);
    }

    const xmlText = await res.text();
    // Parse lightweight S3 ListBucketResult XML with regex
    const items: { key: string; size: number; lastModified: number }[] = [];
    const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
    let match: RegExpExecArray | null;

    while ((match = contentsRegex.exec(xmlText)) !== null) {
      const block = match[1];
      const keyMatch = /<Key>(.*?)<\/Key>/.exec(block);
      const sizeMatch = /<Size>(\d+)<\/Size>/.exec(block);
      const dateMatch = /<LastModified>(.*?)<\/LastModified>/.exec(block);

      if (keyMatch) {
        items.push({
          key: keyMatch[1],
          size: sizeMatch ? Number(sizeMatch[1]) : 0,
          lastModified: dateMatch ? new Date(dateMatch[1]).getTime() : Date.now()
        });
      }
    }

    return items;
  }
}
