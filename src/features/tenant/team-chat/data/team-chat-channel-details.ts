import type { PresenceStatus, WorkspaceChannel } from './team-chat-ui-data';

export interface ChannelMember {
  id: string;
  name: string;
  displayName?: string;
  role: string;
  status: PresenceStatus;
  email: string;
  localTime: string;
  avatarUrl?: string;
}

export interface ChannelDetailTabItem {
  id: string;
  label: string;
  hidden?: boolean;
}

export interface ChannelDetails {
  notificationPreference: 'all-posts' | 'mentions' | 'muted';
  topic: string;
  description: string;
  createdBy: string;
  createdAt: string;
  members: ChannelMember[];
  tabs: ChannelDetailTabItem[];
}

export const channelDetailsById: Record<WorkspaceChannel['id'], ChannelDetails> = {
  'app-development': {
    notificationPreference: 'all-posts',
    topic: 'Frontend and backend sprint delivery',
    description:
      'Daily coordination for shipping features, reviewing blockers, and aligning web plus API milestones.',
    createdBy: 'Engineering Lead',
    createdAt: '14 Jan 2025',
    members: [
      {
        id: 'alex-dev',
        name: 'Alex Dev',
        displayName: 'Alex Johnson',
        role: 'Frontend Engineer',
        status: 'online',
        email: 'alex.johnson@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'mike-backend',
        name: 'Mike Backend',
        displayName: 'Michael Chen',
        role: 'Backend Engineer',
        status: 'online',
        email: 'michael.chen@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'diya-patel',
        name: 'Diya Patel',
        displayName: 'Diya Patel',
        role: 'Product Designer',
        status: 'online',
        email: 'diya.patel@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'jason-ui',
        name: 'Jason UI',
        displayName: 'Jason Tran',
        role: 'Staff Engineer',
        status: 'away',
        email: 'jason.tran@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      },
    ],
    tabs: [
      { id: 'messages', label: 'Messages' },
      { id: 'files', label: 'Files' },
      { id: 'photos', label: 'Photos' },
      { id: 'pins', label: 'Pins', hidden: true },
    ],
  },
  general: {
    notificationPreference: 'all-posts',
    topic: 'Company-wide updates and announcements',
    description:
      'Broadcasts for launches, internal news, leadership notes, and operational reminders.',
    createdBy: 'Workspace Admin',
    createdAt: '03 Jan 2025',
    members: [
      {
        id: 'nina-product',
        name: 'Nina Product',
        displayName: 'Nina Vu',
        role: 'Product Manager',
        status: 'online',
        email: 'nina.vu@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'priya-shah',
        name: 'Priya Shah',
        displayName: 'Priya Shah',
        role: 'People Ops',
        status: 'away',
        email: 'priya.shah@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'piyush-aryan',
        name: 'Piyush Aryan',
        displayName: 'Piyush Aryan',
        role: 'Backend Engineer',
        status: 'online',
        email: 'piyush.aryan@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=120&q=80',
      },
    ],
    tabs: [
      { id: 'messages', label: 'Messages' },
      { id: 'files', label: 'Files' },
      { id: 'photos', label: 'Photos' },
    ],
  },
  issues: {
    notificationPreference: 'all-posts',
    topic: 'Bugs, incidents, hotfixes, and release blockers',
    description:
      'Triage room for production issues, browser regressions, email loops, and release hotpatch coordination.',
    createdBy: 'Owen Tran',
    createdAt: '11 Feb 2025',
    members: [
      {
        id: 'alex-dev',
        name: 'Alex Dev',
        displayName: 'Alex Johnson',
        role: 'Frontend Engineer',
        status: 'online',
        email: 'alex.johnson@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'nina-product',
        name: 'Nina Product',
        displayName: 'Nina Vu',
        role: 'Product Manager',
        status: 'online',
        email: 'nina.vu@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'jason-ui',
        name: 'Jason UI',
        displayName: 'Jason Tran',
        role: 'Staff Engineer',
        status: 'away',
        email: 'jason.tran@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'sophia-ops',
        name: 'Sophia Ops',
        displayName: 'Sophia Le',
        role: 'Operations Lead',
        status: 'online',
        email: 'sophia.le@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'mike-backend',
        name: 'Mike Backend',
        displayName: 'Michael Chen',
        role: 'Backend Engineer',
        status: 'online',
        email: 'michael.chen@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'aarav-shen',
        name: 'Aarav Shen',
        displayName: 'Aarav Shen',
        role: 'Frontend Engineer',
        status: 'online',
        email: 'aarav.shen@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'diya-patel',
        name: 'Diya Patel',
        displayName: 'Diya Patel',
        role: 'Product Designer',
        status: 'online',
        email: 'diya.patel@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'rohan',
        name: 'Rohan',
        displayName: 'Rohan Singh',
        role: 'QA Engineer',
        status: 'away',
        email: 'rohan.singh@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
      },
    ],
    tabs: [
      { id: 'messages', label: 'Messages' },
      { id: 'files', label: 'Files' },
      { id: 'photos', label: 'Photos' },
      { id: 'pins', label: 'Pins', hidden: true },
    ],
  },
  'tech-talk': {
    notificationPreference: 'mentions',
    topic: 'Architecture, performance, and engineering deep dives',
    description:
      'Long-form technical discussions covering platform performance, tradeoffs, and implementation notes.',
    createdBy: 'Architecture Guild',
    createdAt: '18 Jan 2025',
    members: [
      {
        id: 'jason-ui',
        name: 'Jason UI',
        displayName: 'Jason Tran',
        role: 'Staff Engineer',
        status: 'online',
        email: 'jason.tran@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'piyush-aryan',
        name: 'Piyush Aryan',
        displayName: 'Piyush Aryan',
        role: 'Backend Engineer',
        status: 'online',
        email: 'piyush.aryan@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=120&q=80',
      },
    ],
    tabs: [
      { id: 'messages', label: 'Messages' },
      { id: 'files', label: 'Files' },
      { id: 'photos', label: 'Photos' },
    ],
  },
  'creative-corner': {
    notificationPreference: 'mentions',
    topic: 'Design reviews and concept explorations',
    description:
      'Private design critique space for UI explorations, motion concepts, and visual QA handoff.',
    createdBy: 'Design Team',
    createdAt: '02 Feb 2025',
    members: [
      {
        id: 'diya-patel',
        name: 'Diya Patel',
        displayName: 'Diya Patel',
        role: 'Product Designer',
        status: 'online',
        email: 'diya.patel@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'priya-shah',
        name: 'Priya Shah',
        displayName: 'Priya Shah',
        role: 'People Ops',
        status: 'away',
        email: 'priya.shah@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=120&q=80',
      },
    ],
    tabs: [
      { id: 'messages', label: 'Messages' },
      { id: 'files', label: 'Files' },
      { id: 'photos', label: 'Photos' },
    ],
  },
  'book-nook': {
    notificationPreference: 'muted',
    topic: 'Reading club and knowledge sharing',
    description:
      'Small private channel for book recommendations, notes, and asynchronous learning takeaways.',
    createdBy: 'People Ops',
    createdAt: '21 Feb 2025',
    members: [
      {
        id: 'sophia-ops',
        name: 'Sophia Ops',
        displayName: 'Sophia Le',
        role: 'Operations Lead',
        status: 'online',
        email: 'sophia.le@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: 'nayan-nook',
        name: 'Nayan Nook',
        displayName: 'Nayan Nook',
        role: 'Customer Success',
        status: 'away',
        email: 'nayan.nook@iccp.io',
        localTime: '3:14 PM',
        avatarUrl:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      },
    ],
    tabs: [
      { id: 'messages', label: 'Messages' },
      { id: 'files', label: 'Files' },
      { id: 'photos', label: 'Photos' },
    ],
  },
};
