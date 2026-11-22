import React from 'react';
import { Composition } from 'remotion';
import { Explainer, FPS, TOTAL } from './Explainer';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ExplainerWide" component={Explainer} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
    <Composition id="ExplainerTall" component={Explainer} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
  </>
);
