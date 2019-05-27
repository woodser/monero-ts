using namespace std;

MoneroWallet::MoneroWallet() {
  cout << "constructing" << endl;
}

MoneroWallet::~MoneroWallet() {
  cout << "deconstructing" << endl;
}

void MoneroWallet::getMnemonic(epee::wipeable_string& mnemonic) const {
  throw runtime_error("Not implemented");
}
