/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import './PromptController';
import './PlayPauseButton';
import type { PlaybackState, Prompt } from '../types';
import { MidiDispatcher } from '../utils/MidiDispatcher';

/** The grid of prompt inputs. */
@customElement('prompt-dj-midi')
export class PromptDjMidi extends LitElement {
  static override styles = css`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      position: relative;
      background-color: #1a1a2e;
      overflow: hidden;
    }
    #background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, #10101b 0%, #2c2c54 100%);
      z-index: -1;
    }
    #grid {
      width: 80vmin;
      height: 80vmin;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2.5vmin;
    }
    prompt-controller {
      width: 100%;
    }
    play-pause-button {
      position: relative;
      width: 15vmin;
      margin-top: 5vmin;
    }
    #buttons {
      position: absolute;
      top: 20px;
      left: 20px;
      padding: 5px;
      display: flex;
      gap: 10px;
      z-index: 10;
    }
    button {
      font-family: 'Poppins', sans-serif;
      font-weight: 500;
      cursor: pointer;
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
      -webkit-font-smoothing: antialiased;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      user-select: none;
      padding: 8px 12px;
      transition: all 0.2s ease;
    }
    button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    button.active {
      background-color: #fff;
      color: #1a1a2e;
    }
    select {
      font-family: 'Poppins', sans-serif;
      padding: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      outline: none;
      cursor: pointer;
    }
    select option {
      background: #1a1a2e;
      color: #fff;
    }
  `;

  private prompts: Map<string, Prompt>;
  private midiDispatcher: MidiDispatcher;

  @property({ type: Boolean }) private showMidi = false;
  @property({ type: String }) public playbackState: PlaybackState = 'stopped';
  @state() public audioLevel = 0;
  @state() private midiInputIds: string[] = [];
  @state() private activeMidiInputId: string | null = null;

  @property({ type: Object })
  private filteredPrompts = new Set<string>();

  constructor(
    initialPrompts: Map<string, Prompt>,
  ) {
    super();
    this.prompts = initialPrompts;
    this.midiDispatcher = new MidiDispatcher();
  }

  private handlePromptChanged(e: CustomEvent<Prompt>) {
    const { promptId, text, weight, cc } = e.detail;
    const prompt = this.prompts.get(promptId);

    if (!prompt) {
      console.error('prompt not found', promptId);
      return;
    }

    prompt.text = text;
    prompt.weight = weight;
    prompt.cc = cc;

    const newPrompts = new Map(this.prompts);
    newPrompts.set(promptId, prompt);

    this.prompts = newPrompts;
    this.requestUpdate();

    this.dispatchEvent(
      new CustomEvent('prompts-changed', { detail: this.prompts }),
    );
  }

  private toggleShowMidi() {
    return this.setShowMidi(!this.showMidi);
  }

  public async setShowMidi(show: boolean) {
    this.showMidi = show;
    if (!this.showMidi) return;
    try {
      const inputIds = await this.midiDispatcher.getMidiAccess();
      this.midiInputIds = inputIds;
      this.activeMidiInputId = this.midiDispatcher.activeMidiInputId;
    } catch (e) {
      this.showMidi = false;
      this.dispatchEvent(new CustomEvent('error', {detail: e.message}));
    }
  }

  private handleMidiInputChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newMidiId = selectElement.value;
    this.activeMidiInputId = newMidiId;
    this.midiDispatcher.activeMidiInputId = newMidiId;
  }

  private playPause() {
    this.dispatchEvent(new CustomEvent('play-pause'));
  }

  public addFilteredPrompt(prompt: string) {
    this.filteredPrompts = new Set([...this.filteredPrompts, prompt]);
  }

  override render() {
    return html`<div id="background"></div>
      <div id="buttons">
        <button
          @click=${this.toggleShowMidi}
          class=${this.showMidi ? 'active' : ''}
          >MIDI</button
        >
        <select
          @change=${this.handleMidiInputChange}
          .value=${this.activeMidiInputId || ''}
          style=${this.showMidi ? '' : 'visibility: hidden'}>
          ${this.midiInputIds.length > 0
        ? this.midiInputIds.map(
          (id) =>
            html`<option value=${id}>
                    ${this.midiDispatcher.getDeviceName(id)}
                  </option>`,
        )
        : html`<option value="">No devices found</option>`}
        </select>
      </div>
      <div id="grid">${this.renderPrompts()}</div>
      <play-pause-button .playbackState=${this.playbackState} @click=${this.playPause}></play-pause-button>`;
  }

  private renderPrompts() {
    return [...this.prompts.values()].map((prompt) => {
      return html`<prompt-controller
        promptId=${prompt.promptId}
        ?filtered=${this.filteredPrompts.has(prompt.text)}
        cc=${prompt.cc}
        text=${prompt.text}
        weight=${prompt.weight}
        color=${prompt.color}
        .midiDispatcher=${this.midiDispatcher}
        .showCC=${this.showMidi}
        audioLevel=${this.audioLevel}
        @prompt-changed=${this.handlePromptChanged}>
      </prompt-controller>`;
    });
  }
}