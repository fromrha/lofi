/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

/** Maps prompt weight to halo size. */
const MIN_HALO_SCALE = 1;
const MAX_HALO_SCALE = 2;

/** The amount of scale to add to the halo based on audio level. */
const HALO_LEVEL_MODIFIER = 1;

/** A knob for adjusting and visualizing prompt weight. */
@customElement('weight-knob')
export class WeightKnob extends LitElement {
  static override styles = css`
    :host {
      cursor: grab;
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      flex-shrink: 0;
      touch-action: none;
    }
    svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    #halo {
      position: absolute;
      z-index: -1;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      mix-blend-mode: screen;
      transform: scale(1);
      will-change: transform;
      opacity: 0;
      transition: opacity 0.3s;
    }
  `;

  @property({ type: Number }) value = 0;
  @property({ type: String }) color = '#000';
  @property({ type: Number }) audioLevel = 0;

  private dragStartPos = 0;
  private dragStartValue = 0;

  constructor() {
    super();
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
  }

  private handlePointerDown(e: PointerEvent) {
    e.preventDefault();
    this.dragStartPos = e.clientY;
    this.dragStartValue = this.value;
    document.body.classList.add('dragging');
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  private handlePointerMove(e: PointerEvent) {
    const delta = this.dragStartPos - e.clientY;
    this.value = this.dragStartValue + delta * 0.01;
    this.value = Math.max(0, Math.min(2, this.value));
    this.dispatchEvent(new CustomEvent<number>('input', { detail: this.value }));
  }

  private handlePointerUp() {
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    document.body.classList.remove('dragging');
  }

  private handleWheel(e: WheelEvent) {
    const delta = e.deltaY;
    this.value = this.value + delta * -0.0025;
    this.value = Math.max(0, Math.min(2, this.value));
    this.dispatchEvent(new CustomEvent<number>('input', { detail: this.value }));
  }

  private describeArc(
    centerX: number,
    centerY: number,
    startAngle: number,
    endAngle: number,
    radius: number,
  ): string {
    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';

    return (
      `M ${startX} ${startY}` +
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
    );
  }

  override render() {
    const rotationRange = Math.PI * 2 * 0.75;
    const minRot = -rotationRange / 2 - Math.PI / 2;
    const maxRot = rotationRange / 2 - Math.PI / 2;
    const rot = minRot + (this.value / 2) * (maxRot - minRot);

    let scale = (this.value / 2) * (MAX_HALO_SCALE - MIN_HALO_SCALE);
    scale += MIN_HALO_SCALE;
    scale += this.audioLevel * HALO_LEVEL_MODIFIER;

    const haloOpacity = this.value > 0 ? (this.value / 2) * 0.7 + 0.3 : 0;

    const haloStyle = styleMap({
      display: this.value > 0 ? 'block' : 'none',
      background: this.color,
      transform: `scale(${scale})`,
      opacity: String(haloOpacity),
    });

    return html`
      <div id="halo" style=${haloStyle}></div>
      <svg
        viewBox="0 0 80 80"
        @pointerdown=${this.handlePointerDown}
        @wheel=${this.handleWheel}>
        <!-- Base -->
        <circle cx="40" cy="40" r="30" fill="rgba(0, 0, 0, 0.2)" />
        
        <!-- Track -->
        <path
          d=${this.describeArc(40, 40, minRot, maxRot, 34.5)}
          fill="none"
          stroke="rgba(0, 0, 0, 0.4)"
          stroke-width="3"
          stroke-linecap="round" />
          
        <!-- Value Arc -->
        <path
          d=${this.describeArc(40, 40, minRot, rot, 34.5)}
          fill="none"
          stroke=${this.color}
          stroke-width="3"
          stroke-linecap="round" />

        <!-- Center Knob -->
        <circle cx="40" cy="40" r="25" fill="#1a1a2e" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1"/>
        
        <!-- Indicator line -->
        <g transform="translate(40, 40) rotate(${rot * 180 / Math.PI})">
          <line x1="15" y1="0" x2="25" y2="0" stroke=${this.color} stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'weight-knob': WeightKnob;
  }
}