[Lambda ORM](../README.md) / ModifyFilterClauses

# Interface: ModifyFilterClauses\<T\>

## Type parameters

| Name |
| :------ |
| `T` |

## Table of contents

### Methods

- [include](ModifyFilterClauses.md#include)

## Methods

### include

▸ **include**(`predicate`, `thisArg?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `predicate` | (`value`: `T`, `index`: `number`, `array`: `T`[]) => `unknown` |
| `thisArg?` | `any` |

#### Returns

`void`

#### Defined in

[src/lib/repository/domain/queryable.ts:220](https://github.com/lambda-orm/lambdaorm-base/blob/a58dda5e4f2d6e9b7ef66b6cca91cfc1db3470e3/src/lib/repository/domain/queryable.ts#L220)
