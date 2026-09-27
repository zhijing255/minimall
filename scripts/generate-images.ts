import { PrismaClient } from "@prisma/client";
import { syncAllImages } from "./lib/image-gen";

const prisma = new PrismaClient();

async function main() {
  const result = await syncAllImages(prisma);
  console.log(
    `Synced ${result.products} products, ${result.categories} categories`
  );
  if (result.placeholderLeft > 0) {
    console.error(
      `FAIL: ${result.placeholderLeft} placeholder URLs remain in DB`
    );
    process.exit(1);
  }
  console.log("OK: 0 placeholder URLs remain");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
