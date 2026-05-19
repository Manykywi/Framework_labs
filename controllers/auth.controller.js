async function register(request, reply) {
  const user = await request.server.authService.register(request.body);
  return reply.code(201).send({ id: user.id, email: user.email });
}

async function login(request, reply) {
  const user = await request.server.authService.verifyCredentials(request.body);
  if (!user) return reply.unauthorized('Invalid email or password');
  request.session.userId = user.id;
  return reply.code(200).send({ id: user.id, email: user.email });
}

async function logout(request, reply) {
  await request.session.destroy();
  return reply.code(204).send();
}

export default { register, login, logout };
