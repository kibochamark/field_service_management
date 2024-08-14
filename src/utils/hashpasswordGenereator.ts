import bcrypt from 'bcryptjs';

// Function to hash a password
export const hashPassword = async (password: string): Promise<{ salt: string; hashedPassword: string }> => {
  // Generate a salt
  const salt = await bcrypt.genSalt(10); // You can adjust the salt rounds (10) as needed
  // Hash the password with the generated salt
  const hashedPassword = await bcrypt.hash(password, salt);
  // Return both the salt and the hashed password
  return { salt, hashedPassword };
};

// Function to compare a plain password with a hashed password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  // Compare the provided password with the hashed password
  return await bcrypt.compare(password, hashedPassword);
};
