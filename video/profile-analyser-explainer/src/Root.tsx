import React from 'react';
import { Composition } from 'remotion';
import { Explainer, FPS, TOTAL } from './Explainer';
import { RealUIExplainer } from './RealUI';

export const RemotionRoot: React.FC = () => (
  <>
    {/* Variant A: illustrated */}
    <Composition id="ExplainerWide" component={Explainer} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
    <Composition id="ExplainerTall" component={Explainer} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    {/* Variant B: real product UI */}
    <Composition id="RealUIWide" component={RealUIExplainer} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
    <Composition id="RealUITall" component={RealUIExplainer} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
  </>
);
