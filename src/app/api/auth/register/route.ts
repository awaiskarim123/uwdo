
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerUserSchema } from '@/lib/validations/user';
import { hashPassword } from '@/lib/utils/password';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json().catch((error) => {
      if (error instanceof SyntaxError || error instanceof TypeError) {
        return null; 
      }
      throw error;
    });

    if (!body || typeof body !== 'object') {
      return errorResponse('Invalid JSON payload', 400);
    }

    const validationResult = registerUserSchema.safeParse(body);

    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(issue.message);
      });
      return validationErrorResponse(errors);
    }

    const { name, email, password } = validationResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse('User with this email already exists', 409);
    }

    const hashedPassword = await hashPassword(password);

    // Fixed role assignment to prevent privilege escalation
    // All new users are assigned VICE_PRESIDENT role (non-administrative)
    // Role from request body is ignored for security
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'VICE_PRESIDENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(user, 'User registered successfully', 201);
  } catch (error) {
    console.error('Registration error:', error);
    
    return errorResponse('An error occurred during registration', 500);
  }
}
