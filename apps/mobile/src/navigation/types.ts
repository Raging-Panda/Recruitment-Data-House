export type ProfileStackParamList = {
  ProfileHome: undefined;
  Projects: undefined;
  Analytics: undefined;
  Interviews: undefined;
};

export type MessagesStackParamList = {
  MessagesHome: undefined;
  MessageThread: { conversationId: string; otherName?: string };
};

export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Add: undefined;
  Messages: undefined;
  ProfileTab: undefined;
};
