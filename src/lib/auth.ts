export async function getOrCreateUser() {
const { userId: clerkId } = await auth();
if (!clerkId) return null;

const clerkUser = await currentUser();
if (!clerkUser) return null;

const email = clerkUser.emailAddresses[0]?.emailAddress;
if (!email) return null;

let user = await prisma.user.findUnique({
where: { email },
});

if (user) {
user = await prisma.user.update({
where: { email },
data: {
clerkId,
name: clerkUser.fullName ?? clerkUser.firstName ?? user.name,
},
});
} else {
user = await prisma.user.create({
data: {
clerkId,
email,
name: clerkUser.fullName ?? clerkUser.firstName ?? "User",
},
});
}

return user;
}

