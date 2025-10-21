import prisma from "@/lib/prisma";

(async () => {
  const settings = await prisma.siteSetting.findMany();
  console.log(JSON.stringify(settings, null, 2));
  await prisma.$disconnect();
})();
