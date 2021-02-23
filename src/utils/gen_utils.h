/**
 * Copyright (c) woodser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Parts of this file are originally copyright (c) 2014-2019, The Monero Project
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 * All rights reserved.
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of
 *    conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list
 *    of conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors may be
 *    used to endorse or promote products derived from this software without specific
 *    prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
 * THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Parts of this file are originally copyright (c) 2012-2013 The Cryptonote developers
 */
#pragma once

#ifndef gen_utils_h
#define gen_utils_h

#include <boost/lexical_cast.hpp>
#include "include_base_utils.h"
#include "common/util.h"

/**
 * Collection of generic utilities.
 */
namespace gen_utils
{
  // ------------------------- VALUE RECONCILATION ----------------------------

  // TODO: refactor common template code
  template <class T, typename std::enable_if<std::is_same<T, std::string>::value, T>::type* = nullptr>
  boost::optional<T> reconcile(const boost::optional<T>& val1, const boost::optional<T>& val2, boost::optional<bool> resolve_defined, boost::optional<bool> resolve_true, boost::optional<bool> resolve_max, const std::string& err_msg = "") {

    // check for equality
    if (val1 == val2) return val1;

    // resolve one value none
    if (val1 == boost::none || val2 == boost::none) {
      if (resolve_defined != boost::none && *resolve_defined == false) return boost::none;
      else return val1 == boost::none ? val2 : val1;
    }

    throw std::runtime_error(std::string("Cannot reconcile strings: ") + boost::lexical_cast<std::string>(val1) + std::string(" vs ") + boost::lexical_cast<std::string>(val2) + (!err_msg.empty() ? std::string(". ") + err_msg : std::string("")));
  }
  template <class T, typename std::enable_if<std::is_same<T, std::string>::value, T>::type* = nullptr>
  boost::optional<T> reconcile(const boost::optional<T>& val1, const boost::optional<T>& val2, const std::string& err_msg = "") {
    return reconcile(val1, val2, boost::none, boost::none, boost::none, err_msg);
  }

  template <class T, typename std::enable_if<std::is_integral<T>::value, T>::type* = nullptr>
  boost::optional<T> reconcile(const boost::optional<T>& val1, const boost::optional<T>& val2, boost::optional<bool> resolve_defined, boost::optional<bool> resolve_true, boost::optional<bool> resolve_max, const std::string& err_msg = "") {

    // check for equality
    if (val1 == val2) return val1;

    // resolve one value none
    if (val1 == boost::none || val2 == boost::none) {
      if (resolve_defined != boost::none && *resolve_defined == false) return boost::none;
      else return val1 == boost::none ? val2 : val1;
    }

    // resolve different booleans
    if (resolve_true != boost::none) return (bool) val1 == *resolve_true ? val1 : val2; // if resolve true, return true, else return false

    // resolve different numbers
    if (resolve_max != boost::none) return *resolve_max ? std::max(*val1, *val2) : std::min(*val1, *val2);

    // cannot reconcile
    throw std::runtime_error(std::string("Cannot reconcile integrals: ") + boost::lexical_cast<std::string>(val1) + std::string(" vs ") + boost::lexical_cast<std::string>(val2) + (!err_msg.empty() ? std::string(". ") + err_msg : std::string("")));
  }
  template <class T, typename std::enable_if<std::is_integral<T>::value, T>::type* = nullptr>
  boost::optional<T> reconcile(const boost::optional<T>& val1, const boost::optional<T>& val2, const std::string& err_msg = "") {
    return reconcile(val1, val2, boost::none, boost::none, boost::none, err_msg);
  }

  template <class T>
  std::vector<T> reconcile(const std::vector<T>& v1, const std::vector<T>& v2, const std::string& err_msg = "") {

    // check for equality
    if (v1 == v2) return v1;

    // resolve one vector empty
    if (v1.empty()) return v2;
    if (v2.empty()) return v1;

    // otherwise cannot reconcile
    throw std::runtime_error("Cannot reconcile vectors" + (!err_msg.empty() ? std::string(". ") + err_msg : std::string("")));
  }
}
#endif /* gen_utils_h */
