export type IconName =
  | 'home'
  | 'folder'
  | 'spark'
  | 'terminal'
  | 'gear'
  | 'send'
  | 'stop'
  | 'trash'
  | 'back'
  | 'plus'
  | 'close'
  | 'check'
  | 'chevron'
  | 'branch'
  | 'commit'
  | 'pull'
  | 'file'
  | 'filePlus'
  | 'refresh'
  | 'lock'
  | 'shield'
  | 'download'
  | 'search'
  | 'github'
  | 'menu'
  | 'edit'
  | 'external'
  | 'logout'
  | 'key'
  | 'warning'
  | 'clock'
  | 'desktop'
  | 'phone'
  | 'save'
  | 'diff'
  | 'eye';

const PATHS: Record<IconName, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5',
  folder: 'M3 7.5A1.5 1.5 0 0 1 4.5 6h4.2l2 2.2h8.8A1.5 1.5 0 0 1 21 9.7v8.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z',
  spark: 'M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9zM18.5 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  terminal: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM7.5 10l3 2.5-3 2.5M12.5 15h4',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19.4 13.5a7.7 7.7 0 0 0 0-3l1.7-1.3-1.8-3.1-2 .8a7.5 7.5 0 0 0-2.6-1.5L14.3 3h-3.6l-.4 2.4a7.5 7.5 0 0 0-2.6 1.5l-2-.8-1.8 3.1 1.7 1.3a7.7 7.7 0 0 0 0 3l-1.7 1.3 1.8 3.1 2-.8a7.5 7.5 0 0 0 2.6 1.5l.4 2.4h3.6l.4-2.4a7.5 7.5 0 0 0 2.6-1.5l2 .8 1.8-3.1z',
  send: 'M4 12 20 4l-4 16-4.5-6.5zM11.5 13.5 20 4',
  stop: 'M7 7h10v10H7z',
  trash: 'M5 7h14M10 7V5h4v2M7 7l.8 12h8.4L17 7M10 11v5M14 11v5',
  back: 'M15 5l-7 7 7 7',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  chevron: 'M9 5l7 7-7 7',
  branch: 'M7 4v12M7 16a2.5 2.5 0 1 0 0 .01M17 8a2.5 2.5 0 1 0 0 .01M17 10.5c0 4-10 2-10 5.5',
  commit: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM3 12h6M15 12h6',
  pull: 'M6 4v10M6 18.5a2 2 0 1 0 0 .01M18 18.5a2 2 0 1 0 0 .01M18 16V9a3 3 0 0 0-3-3h-3M14 3.5 11.5 6 14 8.5',
  file: 'M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 15.5h6',
  filePlus: 'M6 3.5h8l4 4v13H6zM14 3.5v4h4M12 11v6M9 14h6',
  refresh: 'M19 8a7.5 7.5 0 0 0-13.2-1.5L4 9M4 4v5h5M5 16a7.5 7.5 0 0 0 13.2 1.5L20 15M20 20v-5h-5',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  shield: 'M12 3.5l7 2.8v5.4c0 4.2-2.9 7.6-7 8.8-4.1-1.2-7-4.6-7-8.8V6.3zM9 12l2.2 2.2L15.5 10',
  download: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14',
  search: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5 20 20',
  github: 'M9 19c-4 1.2-4-2-5.5-2.5M14.5 21v-3.2c0-.9.1-1.4-.5-2 2.600-.3 5.300-1.300 5.300-5.800a4.500 4.500 0 0 0-1.200-3.100 4.200 4.200 0 0 0-.1-3.100s-1-.3-3.200 1.200a11 11 0 0 0-5.800 0C6.800 3.700 5.800 4 5.800 4a4.200 4.200 0 0 0-.1 3.100A4.500 4.500 0 0 0 4.500 10.200c0 4.500 2.700 5.500 5.300 5.800-.6.600-.6 1.200-.5 2V21',
  menu: 'M4 7h16M4 12h16M4 17h16',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5H5V6h5',
  logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
  key: 'M8.500 9a4.500 4.500 0 1 0 0 .01M12.500 11 20 18.500M16.500 15l2-2M18 17.500l2-2',
  warning: 'M12 4l9 16H3zM12 10v4.500M12 17.200v.01',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4.500l3 1.800',
  desktop: 'M3.500 5h17v11h-17zM9 20h6M12 16v4',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
  save: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6',
  diff: 'M8 4v10M3.500 9h9M13 18h9M17 4v6M14 7h6',
  eye: 'M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12zM12 9.500a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5z',
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
