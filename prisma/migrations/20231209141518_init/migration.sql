-- CreateTable
CREATE TABLE "Users" (
    "ID" SERIAL NOT NULL,
    "Phonenumber" TEXT NOT NULL,
    "Username" TEXT NOT NULL,
    "Password" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "Tokens" (
    "ID" SERIAL NOT NULL,
    "ID_customer" INTEGER NOT NULL,
    "Token" TEXT NOT NULL,
    "Status" INTEGER NOT NULL,
    "Create_At" TIMESTAMP(3) NOT NULL,
    "Expire" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tokens_pkey" PRIMARY KEY ("ID")
);
