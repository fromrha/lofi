/**
 * @fileoverview Control real time music with a MIDI controller
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PlaybackState, Prompt } from './types';
import { GoogleGenAI, LiveMusicFilteredPrompt } from '@google/genai';
import { PromptDjMidi } from './components/PromptDjMidi';
import { ToastMessage } from './components/ToastMessage';
import { LiveMusicHelper } from './utils/LiveMusicHelper';
import { AudioAnalyser } from './utils/AudioAnalyser';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'lyria-realtime-exp';

function main() {
  const initialPrompts = buildInitialPrompts();

  const pdjMidi = new PromptDjMidi(initialPrompts);
  document.body.appendChild(pdjMidi);

  const toastMessage = new ToastMessage();
  document.body.appendChild(toastMessage);

  const liveMusicHelper = new LiveMusicHelper(ai, model);
  liveMusicHelper.setWeightedPrompts(initialPrompts);

  const audioAnalyser = new AudioAnalyser(liveMusicHelper.audioContext);
  liveMusicHelper.extraDestination = audioAnalyser.node;

  pdjMidi.addEventListener('prompts-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<Map<string, Prompt>>;
    const prompts = customEvent.detail;
    liveMusicHelper.setWeightedPrompts(prompts);
  }));

  pdjMidi.addEventListener('play-pause', () => {
    liveMusicHelper.playPause();
  });

  liveMusicHelper.addEventListener('playback-state-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<PlaybackState>;
    const playbackState = customEvent.detail;
    pdjMidi.playbackState = playbackState;
    playbackState === 'playing' ? audioAnalyser.start() : audioAnalyser.stop();
  }));

  liveMusicHelper.addEventListener('filtered-prompt', ((e: Event) => {
    const customEvent = e as CustomEvent<LiveMusicFilteredPrompt>;
    const filteredPrompt = customEvent.detail;
    toastMessage.show(filteredPrompt.filteredReason!)
    pdjMidi.addFilteredPrompt(filteredPrompt.text!);
  }));

  const errorToast = ((e: Event) => {
    const customEvent = e as CustomEvent<string>;
    const error = customEvent.detail;
    toastMessage.show(error);
  });

  liveMusicHelper.addEventListener('error', errorToast);
  pdjMidi.addEventListener('error', errorToast);

  audioAnalyser.addEventListener('audio-level-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<number>;
    const level = customEvent.detail;
    pdjMidi.audioLevel = level;
  }));

}

function buildInitialPrompts() {
  // Pick 3 random prompts to start at weight = 1
  const startOn = [...DEFAULT_PROMPTS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const prompts = new Map<string, Prompt>();

  for (let i = 0; i < DEFAULT_PROMPTS.length; i++) {
    const promptId = `prompt-${i}`;
    const prompt = DEFAULT_PROMPTS[i];
    const { text, color } = prompt;
    prompts.set(promptId, {
      promptId,
      text,
      weight: startOn.includes(prompt) ? 1 : 0,
      cc: i,
      color,
    });
  }

  return prompts;
}

const DEFAULT_PROMPTS = [
  // Lo-fi Beats & Rhythms
  { color: '#7b4fe8', text: 'Lofi hip hop drums' },
  { color: '#8a6ee8', text: 'Boom bap beat' },
  { color: '#e84f7b', text: 'Vinyl crackle' },
  { color: '#e86e8f', text: 'Tape hiss' },

  // Melodic & Harmonic Elements
  { color: '#4fe8e8', text: 'Jazzy electric piano' },
  { color: '#6ee8e8', text: 'Warm analog synth pads' },
  { color: '#4f9de8', text: 'Chill guitar melody' },
  { color: '#6eabe8', text: 'Dreamy flute' },
  
  // Bass & Low End
  { color: '#e8ac4f', text: 'Mellow bassline' },
  { color: '#e8c06e', text: 'Subtle sub bass' },

  // Ambiance & FX
  { color: '#7b4fe8', text: 'Rain sounds' },
  { color: '#e84f7b', text: 'Distant city ambience' },
  
  // Textures & Ear Candy
  { color: '#4fe8e8', text: 'Soft vocal chops' },
  { color: '#e8ac4f', text: 'Kalimba melody' },
  { color: '#8a6ee8', text: 'Reverb-drenched piano' },
  { color: '#6eabe8', text: 'Nostalgic synth lead' },
];

main();