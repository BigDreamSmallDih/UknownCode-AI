export type IconName = 'home' | 'folder' | 'spark' | 'terminal' | 'gear' | 'send' | 'stop' | 'trash';

const PATHS: Record<IconName, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5',
  folder: 'M3 7.5A1.5 1.5 0 0 1 4.5 6h4.2l2 2.2h8.8A1.5 1.5 0 0 1 21 9.7v8.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z',
  spark: 'M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9zM18.5 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  terminal: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM7.5 10l3 2.5-3 2.5M12.5 15h4',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 13.5a7.7 7.7 0 0 0 0-3l1.7-1.3-1.8-3.1-2 .8a7.5 7.5 0 0 0-2.6-1.5L14.3 3h-3.6l-.4 2.4a7.5 7.5 0 0 0-2.6 1.5l-2-.8-1.8 3.1 1.7 1.3a7.7 7.7 0 0 0 0 3l-1.7 1.3 1.8 3.1 2-.8a7.5 7.5 0 0 0 2.6 1.5l.4 2.4h3.6l.4-2.4a7.5 7.5 0 0 0 2.6-1.5l2 .8 1.8-3.1z',
  send: 'M4 12 20 4l-4 16-4.5-6.5zM11.5 13.5 20 4',
  stop: 'M7 7h10v10H7z',
  trash: 'M5 7h14M10 7V5h4v2M7 7l.8 12h8.4L17 7M10 11v5M14 11v5',
};

interface IconProps {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
