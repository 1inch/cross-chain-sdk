export type TupleToUnion<ArrayType> = ArrayType extends readonly unknown[]
    ? ArrayType[number]
    : never
