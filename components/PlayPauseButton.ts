/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { svg, css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { PlaybackState } from '../types';

@customElement('play-pause-button')
export class PlayPauseButton extends LitElement {

  @property({ type: String }) playbackState: PlaybackState = 'stopped';

  static override styles = css`
    :host {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    :host(:hover) svg {
      transform: scale(1.1);
    }
    svg {
      width: 100%;
      height: 100%;
      transition: transform 0.3s ease;
    }
    .hitbox {
      pointer-events: all;
      position: absolute;
      width: 80%;
      height: 80%;
      border-radius: 50%;
      cursor: pointer;
    }
    .loader {
      stroke: #ffffff;
      stroke-width: 6;
      stroke-linecap: round;
      animation: spin linear 1s infinite;
      transform-origin: center;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  private renderSvg() {
    return html` <svg
      width="140"
      height="140"
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
    <circle cx="70" cy="70" r="60" fill="rgba(0,0,0,0.2)"/>
    <circle cx="70" cy="70" r="50" fill="#1a1a2e" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
      ${this.renderIcon()}
    </svg>`;
  }

  private renderPause() {
    return svg`<path
      d="M62 45 H 55 V 95 H 62 V 45 Z M 85 45 H 78 V 95 H 85 V 45 Z"
      fill="#FEFEFE"
    />`;
  }

  private renderPlay() {
    return svg`<path d="M55 45 L 95 70 L 55 95 Z" fill="#FEFEFE" />`;
  }

  private renderLoading() {
    return svg`<path class="loader" d="M 70,30 A 40,40 0 0,1 110,70" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" />`;
  }

  private renderIcon() {
    if (this.playbackState === 'playing') {
      return this.renderPause();
    } else if (this.playbackState === 'loading') {
      return this.renderLoading();
    } else {
      return this.renderPlay();
    }
  }

  override render() {
    return html`${this.renderSvg()}<div class="hitbox"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'play-pause-button': PlayPauseButton
  }
}