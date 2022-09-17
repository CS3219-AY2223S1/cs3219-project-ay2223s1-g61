export const COLORS = ['#c63661', '#4286de', '#Aede69', '#f6c344']; // maybe last two no need lmao

export type TCodeEditorUser = {
  id: string;
  color: string;
};

export const sourceUser: TCodeEditorUser = {
  id: 'source',
  color: '#c63661',
};

export const partnerUser: TCodeEditorUser = {
  id: 'partner',
  color: '#4286de',
};
