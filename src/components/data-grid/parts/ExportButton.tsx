import { memo } from 'react';
import { DownloadIcon } from '../../../internal/icons';
import { IconButton } from '../../icon-button/IconButton';
import { TooltipContent, TooltipRoot, TooltipTrigger } from '../../tooltip/Tooltip';

export interface ExportButtonProps {
  /** The name of the button and the words of its tooltip (`labels.exportCsv`). */
  label: string;
  /** The press: the handle's `exportCsv` with `download: true`, the one function of both ways to export. */
  onExport: () => void;
}

/**
 * The button of the toolbar that downloads the rows as CSV (spec phase 6 §4.3 G1, §6.3 "Xuất CSV"): an icon button,
 * `secondary` and `md` as the column chooser's, with a tooltip that says its name. The grid draws it only for a grid
 * that asks for `csvExport`. It writes nothing itself and announces nothing: the browser's download is the answer.
 */
export const ExportButton = memo(function ExportButton({ label, onExport }: ExportButtonProps) {
  return (
    // The tooltip says the name the button has already, so it does not describe it.
    <TooltipRoot describe={false}>
      <TooltipTrigger>
        <IconButton
          variant="secondary"
          size="md"
          className="flg-data-grid-export-button"
          aria-label={label}
          onClick={onExport}
        >
          <DownloadIcon />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center" sideOffset={8}>
        {label}
      </TooltipContent>
    </TooltipRoot>
  );
});
