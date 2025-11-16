import type { Meta, StoryObj } from "@storybook/react";
import s from "./PatternShowcase.module.scss";

const meta = {
  title: "Design System/Patterns",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Halftone: Story = {
  render: () => (
    <div className={s.showcase}>
      <h2>Halftone Patterns</h2>
      <p>Punk/street art inspired dot patterns</p>

      <div className={s.patternGrid}>
        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.halftoneSmWrapper}`}>
            <div className={s.halftoneSm}></div>
          </div>
          <div className={s.info}>
            <h4>Halftone Small</h4>
            <code>@include pattern-halftone-sm</code>
            <p>Subtle texture for cards, overlays</p>
          </div>
        </div>

        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.halftoneMd}`}></div>
          <div className={s.info}>
            <h4>Halftone Medium</h4>
            <code>@include pattern-halftone-md</code>
            <p>Background textures, decorative layers</p>
          </div>
        </div>

        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.halftoneLg}`}></div>
          <div className={s.info}>
            <h4>Halftone Large</h4>
            <code>@include pattern-halftone-lg</code>
            <p>Body backgrounds (used in app.css)</p>
          </div>
        </div>

        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.comicDots}`}></div>
          <div className={s.info}>
            <h4>Comic Dots</h4>
            <code>@include pattern-comic-dots</code>
            <p>Ben-Day dots, pop art style</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Stripes: Story = {
  render: () => (
    <div className={s.showcase}>
      <h2>Stripe Patterns</h2>
      <p>Diagonal and linear patterns for texture</p>

      <div className={s.patternGrid}>
        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.stripesDiagonal}`}></div>
          <div className={s.info}>
            <h4>Diagonal Stripes</h4>
            <code>@include pattern-stripes-diagonal</code>
            <p>Icon frames, decorative borders</p>
          </div>
        </div>

        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.stripesVertical}`}></div>
          <div className={s.info}>
            <h4>Vertical Stripes</h4>
            <code>@include pattern-stripes-vertical</code>
            <p>Section dividers, backgrounds</p>
          </div>
        </div>

        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.grid}`}></div>
          <div className={s.info}>
            <h4>Grid Pattern</h4>
            <code>@include pattern-grid</code>
            <p>Graph paper backgrounds</p>
          </div>
        </div>

        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.checkerboard}`}></div>
          <div className={s.info}>
            <h4>Checkerboard</h4>
            <code>@include pattern-checkerboard</code>
            <p>Transparency backgrounds</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Gradients: Story = {
  render: () => (
    <div className={s.showcase}>
      <h2>Gradient Patterns</h2>
      <p>Multi-layer gradients for depth and interest</p>

      <div className={s.patternGrid}>
        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.glossy}`}></div>
          <div className={s.info}>
            <h4>Glossy Gradient</h4>
            <code>@include gradient-glossy</code>
            <p>Card overlays, shine effect</p>
          </div>
        </div>

        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.spotlight}`}></div>
          <div className={s.info}>
            <h4>Spotlight</h4>
            <code>@include gradient-spotlight</code>
            <p>Hero sections, focus areas</p>
          </div>
        </div>

        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.punkRed}`}></div>
          <div className={s.info}>
            <h4>Punk Red</h4>
            <code>@include gradient-punk-red</code>
            <p>CTA buttons, primary elements</p>
          </div>
        </div>

        <div className={s.patternCard}>
          <div className={`${s.patternSample} ${s.metallic}`}></div>
          <div className={s.info}>
            <h4>Metallic</h4>
            <code>@include gradient-metallic</code>
            <p>Premium/special elements</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ComplexLayers: Story = {
  render: () => (
    <div className={s.showcase}>
      <h2>Complex Layered Patterns</h2>
      <p>Combining multiple effects like ResourcePackCard</p>

      <div className={s.complexGrid}>
        <div className={s.complexCard}>
          <div className={s.cardContent}>
            <h3>Card with Accent Band</h3>
            <p>
              This demonstrates the complex layering from ResourcePackCard with
              glossy overlay + accent diagonal band + halftone texture
            </p>
          </div>
        </div>

        <div className={s.iconFrameExample}>
          <img
            src="https://via.placeholder.com/64/00cc66/ffffff?text=Icon"
            alt="Example"
          />
        </div>
      </div>

      <div className={s.codeExample}>
        <h4>Typical Card Pattern Stack:</h4>
        <pre>
          {`.card {
  background:
    linear-gradient(/* glossy overlay */),
    var(--color-block);

  &::before {
    content: "";
    position: absolute;
    inset: -25%;
    background:
      radial-gradient(/* highlight */),
      radial-gradient(/* shadow */),
      linear-gradient(/* accent band */),
      radial-gradient(/* dots */);
    opacity: 0.7;
    mix-blend-mode: multiply;
  }

  &::after {
    @include pattern-halftone-sm;
  }
}`}
        </pre>
      </div>
    </div>
  ),
};

export const PatternTokens: Story = {
  render: () => (
    <div className={s.showcase}>
      <h2>All Available Pattern Tokens</h2>

      <table className={s.tokenTable}>
        <thead>
          <tr>
            <th>Token Name</th>
            <th>Mixin</th>
            <th>Best Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Halftone Small</td>
            <td>
              <code>@include pattern-halftone-sm;</code>
            </td>
            <td>Subtle card texture</td>
          </tr>
          <tr>
            <td>Halftone Medium</td>
            <td>
              <code>@include pattern-halftone-md;</code>
            </td>
            <td>Background textures</td>
          </tr>
          <tr>
            <td>Halftone Large</td>
            <td>
              <code>@include pattern-halftone-lg;</code>
            </td>
            <td>Body backgrounds</td>
          </tr>
          <tr>
            <td>Comic Dots</td>
            <td>
              <code>@include pattern-comic-dots;</code>
            </td>
            <td>Pop art backgrounds</td>
          </tr>
          <tr>
            <td>Diagonal Stripes</td>
            <td>
              <code>@include pattern-stripes-diagonal;</code>
            </td>
            <td>Icon frames</td>
          </tr>
          <tr>
            <td>Vertical Stripes</td>
            <td>
              <code>@include pattern-stripes-vertical;</code>
            </td>
            <td>Section dividers</td>
          </tr>
          <tr>
            <td>Grid</td>
            <td>
              <code>@include pattern-grid;</code>
            </td>
            <td>Graph paper backgrounds</td>
          </tr>
          <tr>
            <td>Checkerboard</td>
            <td>
              <code>@include pattern-checkerboard;</code>
            </td>
            <td>Transparency showcase</td>
          </tr>
          <tr>
            <td>Glossy Gradient</td>
            <td>
              <code>@include gradient-glossy;</code>
            </td>
            <td>Card shine overlay</td>
          </tr>
          <tr>
            <td>Spotlight</td>
            <td>
              <code>@include gradient-spotlight;</code>
            </td>
            <td>Hero sections</td>
          </tr>
          <tr>
            <td>Punk Red</td>
            <td>
              <code>@include gradient-punk-red;</code>
            </td>
            <td>CTA buttons</td>
          </tr>
          <tr>
            <td>Metallic</td>
            <td>
              <code>@include gradient-metallic;</code>
            </td>
            <td>Premium elements</td>
          </tr>
          <tr>
            <td>Accent Band</td>
            <td>
              <code>@include gradient-accent-band;</code>
            </td>
            <td>::before decorative layers</td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};
