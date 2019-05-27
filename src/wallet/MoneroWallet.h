using namespace std;

/**
 * Monero wallet interface.
 */
 class MoneroWallet {

   /**
    * Construct the wallet.	TODO
    */
   MoneroWallet()

   /**
    * Deconstructs the wallet.
    */
   ~MoneroWallet();

   // --------------------------------- PUBLIC --------------------------------

 public:

//   /**
//    * Get the wallet's seed.
//    *
//    * @return the wallet's seed
//    */
//   const string getSeed();

   /**
    * Get the wallet's mnemonic phrase derived from the seed.
    *
    * @param mnemonic is assigned the wallet's mnemonic phrase
    */
   void getMnemonic(epee::wipeable_string& mnemonic) const;

   // --------------------------------- PRIVATE --------------------------------

 private:

 };
