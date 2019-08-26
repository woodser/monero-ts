
class StartMining {
  
  static async startMining() {
    let numThreads = 6;
    //TestUtils.getWalletRpc().startMining(numThreads, false, true);
    await TestUtils.getDaemonRpc().startMining("56SWsnhejUTbgNs2EgyXdfNXUawymMMuAC9voZZSQrHzJHNxGsAvMnoUja7JcKVtPwNc1oKAkoAt1cv6EmtKRQ22U37B7cT", numThreads, false, false);  // random subaddress
  }
}