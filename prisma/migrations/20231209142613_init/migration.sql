-- CreateTable
CREATE TABLE "Logs" (
    "ID" SERIAL NOT NULL,
    "ID_customer" INTEGER NOT NULL,
    "IP" TEXT NOT NULL,
    "Date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Logs_pkey" PRIMARY KEY ("ID")
);
