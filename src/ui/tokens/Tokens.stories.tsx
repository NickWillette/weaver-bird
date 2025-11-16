import type { Meta, StoryObj } from "@storybook/react";
import s from "./TokenShowcase.module.scss";

const meta = {
  title: "Design System/Tokens",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Shadows: Story = {
  render: () => (
    <div className={s.showcase}>
      <h2>Shadow Tokens</h2>
      <p>Heavy offset shadows for bold, punk aesthetic</p>

      <div className={s.grid}>
        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.shadowSm}`}>Small</div>
          <div className={s.info}>
            <code>@include shadow-sm</code>
            <p>3px 3px 0 - Badges, tags</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.shadowMd}`}>Medium</div>
          <div className={s.info}>
            <code>@include shadow-md</code>
            <p>6px 6px 0 - Buttons, inputs</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.shadowLg}`}>Large</div>
          <div className={s.info}>
            <code>@include shadow-lg</code>
            <p>10px 10px 0 - Cards, panels</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.shadowXl}`}>X-Large</div>
          <div className={s.info}>
            <code>@include shadow-xl</code>
            <p>14px 14px 0 - Hover states</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.shadowInset}`}>Inset</div>
          <div className={s.info}>
            <code>@include shadow-inset</code>
            <p>Inset bottom - Inputs, boxes</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.shadowBadge}`}>Badge</div>
          <div className={s.info}>
            <code>@include shadow-badge</code>
            <p>3px 3px semi-transparent</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Rotations: Story = {
  render: () => (
    <div className={s.showcase}>
      <h2>Rotation Tokens</h2>
      <p>Playful tilts for hand-drawn aesthetic</p>

      <div className={s.grid}>
        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.rotateSlight}`}>Slight</div>
          <div className={s.info}>
            <code>@include rotate-slight</code>
            <p>-0.3deg - Default state</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.rotateMild}`}>Mild</div>
          <div className={s.info}>
            <code>@include rotate-mild</code>
            <p>-2deg - Active state</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.rotateModerate}`}>Moderate</div>
          <div className={s.info}>
            <code>@include rotate-moderate</code>
            <p>3deg - Badges</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.rotateStrong}`}>Strong</div>
          <div className={s.info}>
            <code>@include rotate-strong</code>
            <p>4deg - Decorative</p>
          </div>
        </div>
      </div>

      <h3>Alternating Pattern</h3>
      <div className={s.badgeList}>
        <span className={s.badge}>Badge 1</span>
        <span className={s.badge}>Badge 2</span>
        <span className={s.badge}>Badge 3</span>
        <span className={s.badge}>Badge 4</span>
      </div>
      <code>@include rotate-alternating</code>
    </div>
  ),
};

export const BorderRadius: Story = {
  render: () => (
    <div className={s.showcase}>
      <h2>Border Radius Tokens</h2>
      <p>Asymmetric, quirky borders for playful aesthetic</p>

      <div className={s.grid}>
        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.radiusQuirkySm}`}>Small</div>
          <div className={s.info}>
            <code>@include radius-quirky-sm</code>
            <p>Buttons, badges</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.radiusQuirkyMd}`}>Medium</div>
          <div className={s.info}>
            <code>@include radius-quirky-md</code>
            <p>Inputs, medium cards</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.radiusQuirkyLg}`}>Large</div>
          <div className={s.info}>
            <code>@include radius-quirky-lg</code>
            <p>Large cards, panels</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.radiusIconFrame}`}>Icon Frame</div>
          <div className={s.info}>
            <code>@include radius-icon-frame</code>
            <p>Image containers</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Borders: Story = {
  render: () => (
    <div className={s.showcase}>
      <h2>Border Tokens</h2>
      <p>Heavy borders and accent styles</p>

      <div className={s.grid}>
        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.borderStandard}`}>Standard</div>
          <div className={s.info}>
            <code>@include border-standard</code>
            <p>3px solid - Default</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.borderDashed}`}>Dashed</div>
          <div className={s.info}>
            <code>@include border-dashed</code>
            <p>2px dashed - Frames</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.borderDotted}`}>Dotted</div>
          <div className={s.info}>
            <code>@include border-dotted</code>
            <p>3px dotted - Dropzones</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.borderLeftAccent}`}>
            Left Accent
          </div>
          <div className={s.info}>
            <code>@include border-left-accent</code>
            <p>4px left - Callouts</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Animations: Story = {
  render: () => (
    <div className={s.showcase}>
      <h2>Animation Tokens</h2>
      <p>Spring-like, playful animations</p>

      <div className={s.grid}>
        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.animFloat}`}>Float</div>
          <div className={s.info}>
            <code>@include float</code>
            <p>Gentle up/down motion</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <div className={`${s.sample} ${s.animPulse}`}>Pulse</div>
          <div className={s.info}>
            <code>@include pulse</code>
            <p>Scale breathing effect</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <button className={s.animWiggleBtn} onClick={(e) => {
            e.currentTarget.classList.remove(s.animWiggle);
            setTimeout(() => e.currentTarget.classList.add(s.animWiggle), 10);
          }}>
            Click to Wiggle
          </button>
          <div className={s.info}>
            <code>@include wiggle</code>
            <p>Rotation wiggle</p>
          </div>
        </div>

        <div className={s.tokenCard}>
          <button className={s.animShakeBtn} onClick={(e) => {
            e.currentTarget.classList.remove(s.animShake);
            setTimeout(() => e.currentTarget.classList.add(s.animShake), 10);
          }}>
            Click to Shake
          </button>
          <div className={s.info}>
            <code>@include shake</code>
            <p>Error/validation shake</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const InteractiveCombined: Story = {
  render: () => (
    <div className={s.showcase}>
      <h2>Interactive Combined Tokens</h2>
      <p>Multiple tokens working together (hover me!)</p>

      <div className={s.grid}>
        <div className={`${s.interactiveCard} ${s.example1}`}>
          <h4>Card Example</h4>
          <p>Shadow + Rotate + Translate</p>
          <code>
            @include shadow-lg;
            <br />
            @include rotate-interactive;
          </code>
        </div>

        <div className={`${s.interactiveCard} ${s.example2}`}>
          <h4>Button Example</h4>
          <p>Shadow + Radius + Rotate</p>
          <code>
            @include shadow-md;
            <br />
            @include radius-quirky-sm;
          </code>
        </div>

        <div className={`${s.interactiveCard} ${s.example3}`}>
          <h4>Panel Example</h4>
          <p>Border + Shadow + Pattern</p>
          <code>
            @include border-left-accent;
            <br />
            @include shadow-inset;
          </code>
        </div>
      </div>
    </div>
  ),
};
