import * as sdo from 'schema-dts';

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

// MediaObject is directly inherited from sdo:MediaObject
export type MediaObject = WithRequired<sdo.MediaObject, '@id' | 'description'>;
