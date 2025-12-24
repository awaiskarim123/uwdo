import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginUserSchema } from '@/lib/validations/user';
import { verifyPassword } from '@/lib/utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiration,
} from '@/lib/utils/jwt';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {

    const body = await request.json().catch(() => null);

    if (!body) {
      return errorResponse('Invalid JSON payload', 400);
    }

   
    const validationResult = loginUserSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(
        validationResult.error.flatten().fieldErrors
      );
    }

    // Normalize input ONCE
    const email = validationResult.data.email.toLowerCase().trim();
    const password = validationResult.data.password.trim();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Prevent email enumeration
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

 
    if (!user.isActive) {
      return errorResponse(
        'Account is deactivated. Please contact administrator.',
        403
      );
    }

  
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401);
    }

  
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.role
    );

    const refreshToken = generateRefreshToken();
    const expiresAt = getRefreshTokenExpiration();

   
    await prisma.authToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return successResponse(
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
      'Login successful',
      200
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('An error occurred during login', 500);
  }
}
