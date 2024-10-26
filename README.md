# DTO Builder

Build a DTo object from an interface.

## Installation

**NPM**

```bash
npm install @kilbergr/dto-builder
```

**Yarn**

```bash
yarn add @kilbergr/dto-builder
```

## Usage

```typescript
import { createDtoBuilder } from '@kilbergr/dto-builder';
```

## Examples

### Build a simple DTO

```typescript
import { isRight } from 'fp-ts/Either';
import { createDtoBuilder } from '@kilbergr/dto-builder';

interface User {
  id: number;
  name: string;
  email: string;
  tags: string[];
}

const builder = createDtoBuilder<User>();

const user = builder
  .setId(1)
  .setName('John Doe')
  .setEmail('john.doe@example.com')
  .addTags('tag1', 'tag2')
  .build();

if (isRight(user)) {
  console.log(user.right);
} else {
  console.log('Building user failed', user.left);
}
```

### Patching a DTO

Override a fragment of the DTO.

```typescript
import { createDtoBuilder } from '@kilbergr/dto-builder';

interface User {
  id: number;
  name: string;
  email: string;
}

const builder = createDtoBuilder<User>();

const userBuilder = builder
  .setId(1)
  .setName('John Doe')
  .setEmail('john.doe@example.com');

userBuilder.patch({
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
});
```

### Cloning a DTO builder

Share a common data between multiple DTOs.

```typescript
import { createDtoBuilder } from '@kilbergr/dto-builder';

interface User {
  id: number;
  name: string;
  email: string;
  organization: string;
}

const userBuilder = createDtoBuilder<User>().setOrganization('Test Inc.');
const userOne = userBuilder
  .clone()
  .setId(1)
  .setName('John Doe')
  .setEmail('john.doe@example.com')
  .build();

const userTwo = userBuilder
  .clone()
  .setId(2)
  .setName('Jane Doe')
  .setEmail('jane.doe@example.com')
  .build();
```

### Counting arrays

```typescript
import { createDtoBuilder } from '@kilbergr/dto-builder';

interface WithTags {
  tags: string[];
}

const builder = createDtoBuilder<WithTags>().addTags('tag1', 'tag2', 'tag3');

const tagsCount = builder.countTags();
```

### Validating DTO

The DTO builder can validate the DTO before building it. It requires some
validation function for that. It is possible to use for example some json schema
with ajv.

```typescript
import { Ajv } from 'ajv';
import { createDtoBuilder } from '@kilbergr/dto-builder';

const ajv = new Ajv();


interface UserDto {
  id: number;
  name: string;
  email: string;
}

const userSchema: JsonSchemaType<UserDto> = { ... };

const userDtoValidator = ajv.compile(userSchema);

function validateUserDto(dto: UserDto): boolean {
  if (!userDtoValidator(dto)) {
    const errors = userDtoValidator.errors;

    const error = ... // aggregate errors into one`

    return error;
  };
  return true;
}

const userBuilder = createDtoBuilder<UserDto, UserBuilderError>({}, {
  validate: validateUserDto
});

const user = userBuilder.setId(1).build();

if (isRight(user)) {
  console.log(user.right);
} else {
  console.log('Building user failed', user.left);
}
```
