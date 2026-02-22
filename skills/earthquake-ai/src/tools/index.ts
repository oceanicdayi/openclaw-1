import { tool } from '@openclaw/tools';
import { usgsFetch } from './usgs';
import { pygmtPlot } from './pygmt';
import { geminiExplain } from './gemini';
import { notebookLmGenerate } from './notebooklm';
import { huggingFaceDeploy } from './huggingface';
import { statsAnalyze } from './stats';

export const tools = {
  'usgs.fetch': usgsFetch,
  'pygmt.plot': pygmtPlot,
  'gemini.explain': geminiExplain,
  'notebooklm.generate': notebookLmGenerate,
  'huggingface.deploy': huggingFaceDeploy,
  'stats.analyze': statsAnalyze
};

export type Tools = typeof tools;