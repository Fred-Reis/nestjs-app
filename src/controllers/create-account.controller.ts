import {
  ConflictException,
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common'
import { hash } from 'bcryptjs'
import { z } from 'zod'

import { PrismaService } from 'src/prisma/prisma.services'
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipes'

const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(6),
})

type CreateUserInput = z.infer<typeof createUserSchema>

@Controller('/accounts')
export class CreateAccountController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createUserSchema))
  async handle(@Body() body: CreateUserInput) {
    const { name, email, password } = body

    const userWithSameEmail = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (userWithSameEmail) {
      throw new ConflictException('User with same email already exists')
    }

    const hashPassword = await hash(password, 8)

    await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword,
      },
    })
  }
}
