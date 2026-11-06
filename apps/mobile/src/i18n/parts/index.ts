import { security } from './security';
import { shell } from './shell';
import { ui } from './ui';
import { update } from './update';
import { workspace } from './workspace';

/** Every feature part. Add a new part here and the catalogs, key types and tests pick it up. */
export const PARTS = [shell, workspace, security, update, ui] as const;

type KeysOf<T> = T extends unknown ? keyof T : never;
export type PartKey = KeysOf<(typeof PARTS)[number]['en']>;
