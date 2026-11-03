import { useRef, useState } from 'react';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { Badge } from '../badge/Badge';
import type { Option } from '../../internal/list-rows';

/** Gap between chips, in px; matches `.flg-select-chips`. */
const CHIP_GAP = 4;

/**
 * The chosen values of a multiple Select as chips, as many as fit, and the rest as one "+N" chip.
 * The first chip always shows, cut short when it alone is too wide: a lone "+N" would not say what
 * is chosen. A hidden ruler holds every chip, so what fits is measured without rendering twice.
 */
export function Chips({ chosen }: { chosen: Option[] }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(chosen.length);
  const key = chosen.map((option) => option.value).join('\u0000');
  useIsoLayoutEffect(() => {
    const box = boxRef.current;
    const ruler = rulerRef.current;
    if (!box || !ruler) return;
    const measure = () => {
      const widths = Array.from(ruler.children, (chip) => chip.getBoundingClientRect().width);
      const plus = widths.pop() ?? 0;
      const room = box.clientWidth;
      let used = 0;
      let count = 0;
      for (const [index, width] of widths.entries()) {
        const next = used + (index > 0 ? CHIP_GAP : 0) + width;
        const rest = widths.length - index - 1;
        if (next + (rest > 0 ? CHIP_GAP + plus : 0) > room) break;
        used = next;
        count = index + 1;
      }
      setVisible(Math.max(count, 1));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    // The room changes with the trigger; the chips' widths change when a web font arrives.
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(ruler);
    return () => observer.disconnect();
  }, [key]);
  const hidden = chosen.length - visible;
  return (
    <span ref={boxRef} className="flg-select-chips" aria-hidden="true">
      {chosen.slice(0, visible).map((option) => (
        <Badge key={option.value} variant="neutral">
          <span className="flg-select-chip-label">{option.text}</span>
        </Badge>
      ))}
      {hidden > 0 ? (
        <Badge variant="accent" className="flg-select-more">
          +{hidden}
        </Badge>
      ) : null}
      <span ref={rulerRef} className="flg-select-ruler">
        {chosen.map((option) => (
          <Badge key={option.value} variant="neutral">
            {option.text}
          </Badge>
        ))}
        <Badge variant="accent">+{chosen.length}</Badge>
      </span>
    </span>
  );
}
