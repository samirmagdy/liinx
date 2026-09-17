import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';

export const AnalyticsPanel: React.FC = () => {
  const { tr: ui, lang } = useUiLanguage();
  const {
    analyticsData,
    dataError,
    setActiveTab
  } = useBuilder();

  return (
    <div className="space-y-6 animate-fade-in">
      {dataError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <span>{ui('Analytics could not be loaded. Check your connection and try again.')}</span>
          <button
            type="button"
            onClick={() => {
              setActiveTab('content');
              setTimeout(() => setActiveTab('analytics'), 0);
            }}
            className="rounded-lg border border-rose-300 px-2 py-1 font-semibold"
          >
            {ui('Retry')}
          </button>
        </div>
      )}
      <p className="text-[11px] text-neutral-500">
        {ui('Reports use UTC and the last 30 days. Views count accepted page loads, unique visitors are distinct anonymous visitor hashes, and click-through is total clicks divided by total views.')}
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500">{ui("30-Day Views")}</span>
          <p className="text-2xl font-extrabold text-neutral-900 mt-1 tabular-nums">
            {analyticsData ? analyticsData.totalViews.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US') : '...'}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
            {analyticsData ? `${analyticsData.uniqueVisitors} unique` : ui("loading")}
          </span>
        </div>

        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500">{ui("Click-Through")}</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
            {analyticsData ? analyticsData.ctr : '...'}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold font-mono">{ui("Clicks per view")}</span>
        </div>

        <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-neutral-500">{ui("Total Clicks")}</span>
          <p className="text-2xl font-extrabold text-neutral-900 mt-1 tabular-nums">
            {analyticsData ? analyticsData.totalClicks.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US') : '...'}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono">{ui("Live logged")}</span>
        </div>
      </div>

      {/* 7-Day Daily Bar Chart */}
      {analyticsData && analyticsData.dailyTimeline && (
        <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>{ui("7-Day Engagement Timeline")}</span>
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-neutral-200 rounded" /> {ui("Views")}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded" /> {ui("Clicks")}</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-2 items-end h-32">
            {analyticsData.dailyTimeline.map((day, idx) => {
              const maxVal = Math.max(...analyticsData.dailyTimeline.map(d => Math.max(d.views, 1)));
              const viewHeight = Math.max(8, Math.round((day.views / maxVal) * 100));
              const clickHeight = Math.max(4, Math.round((day.clicks / maxVal) * 100));

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full flex gap-1 items-end justify-center h-24">
                    <div 
                      className="w-3 bg-neutral-200 rounded-t transition-[height] duration-300" 
                      style={{ height: `${viewHeight}%` }}
                      title={`${day.views} views`}
                    />
                    <div 
                      className="w-3 bg-emerald-500 rounded-t transition-[height] duration-300" 
                      style={{ height: `${clickHeight}%` }}
                      title={`${day.clicks} clicks`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 truncate w-full text-center">
                    {day.date.split(',')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Performing Links */}
      {analyticsData && analyticsData.topLinks && (
        <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-neutral-900">{ui("Top Performing Links")}</h3>
          {analyticsData.topLinks.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2">{ui("No clicks recorded yet. Share your link to start tracking!")}</p>
          ) : (
            <div className="space-y-2.5 text-xs">
              {analyticsData.topLinks.map((link) => (
                <div key={link.id} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold truncate max-w-xs">{link.title}</span>
                    <span className="font-mono text-neutral-500 tabular-nums">{link.clicks} {ui("clicks (")}{link.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-neutral-900 rounded-full transition-[width] duration-300" 
                      style={{ width: `${Math.min(100, Math.max(4, link.percentage))}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UTM Campaign & Traffic Attribution */}
      {analyticsData && (
        <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900">{ui("UTM Campaign & Traffic Attribution")}</h3>
            <span className="text-[10px] font-mono text-neutral-500">{ui("Source / Medium / Campaign")}</span>
          </div>
          {!analyticsData.topUtmCampaigns || analyticsData.topUtmCampaigns.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2">
              {ui("No UTM parameters recorded yet. Append")}<code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700 font-mono text-[10px]">{ui("?utm_source=instagram&utm_campaign=spring")}</code> {ui("to your bio URL to start tracking!")}
            </p>
          ) : (
            <div className="divide-y divide-neutral-100 text-xs">
              {analyticsData.topUtmCampaigns.map((utm, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-semibold text-neutral-900">{utm.campaign}</span>
                    <span className="text-[11px] font-mono text-neutral-500">{utm.source} / {utm.medium}</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-800 tabular-nums">{utm.count} {ui("views")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
