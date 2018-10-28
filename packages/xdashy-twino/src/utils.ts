import t, {
  Type, array, failure, success, number, undefined as Undefined, union,
} from 'io-ts';

export function maybe<RT extends t.Any>(
  type: RT,
  name?: string
): t.UnionType<[RT, t.UndefinedType], t.TypeOf<RT> | undefined, t.OutputOf<RT> | undefined, t.InputOf<RT> | undefined> {
  return union<[RT, t.UndefinedType]>([type, Undefined], name)
}

export const DateFromArray = new Type<Date, Array<number>>(
  'DateFromArray',
  (v): v is Date => v instanceof Date,
  (s, c) => array(number).validate(s, c).chain(n => {
      return (n.length !== 7)
        ? failure(n, c)
        : success(new Date(n[0], n[1] - 1, n[2], n[3], n[4], n[5], n[6]));
    }),
  (a) => [
    a.getFullYear(), a.getMonth(), a.getDay(),
    a.getHours(), a.getMinutes(), a.getSeconds(), a.getMilliseconds()
  ],
);

