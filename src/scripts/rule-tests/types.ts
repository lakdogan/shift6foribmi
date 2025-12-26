import type { Shift6ConfigInput } from '../../config/schema';

export interface Case {
  name: string;
  input: string;
  mustInclude: string[];
  mustExclude?: string[];
  config?: Shift6ConfigInput;
}
