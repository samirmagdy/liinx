import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { UserMenuDropdown } from '../src/components/UserMenuDropdown';
import { LanguageProvider } from '../src/context/LanguageContext';
import { initialBuilderTab } from '../src/features/builder/utils/builder.utils';
import { type User } from '../src/types';

describe('UserMenuDropdown & Navigation', () => {
  const dummyUser: User = {
    id: 'usr_123',
    username: 'testcreator',
    email: 'creator@example.com',
    role: 'creator'
  };

  it('renders user badge with username', () => {
    const html = renderToString(
      <LanguageProvider>
        <UserMenuDropdown user={dummyUser} onLogout={() => {}} />
      </LanguageProvider>
    );

    expect(html).toContain('@testcreator');
  });

  it('parses initialBuilderTab from query param correctly', () => {
    expect(initialBuilderTab()).toBe('content');
  });
});
