/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/stream_pay_solana.json`.
 */
export type StreamPaySolana = {
  "address": "4wvijq8n8bUKMsvmyJuhJzmdYq3jDUQYAZ6TXXjZDskS",
  "metadata": {
    "name": "streamPaySolana",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "cancelStream",
      "discriminator": [
        218,
        221,
        38,
        25,
        177,
        207,
        188,
        91
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "organization",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "organization.authority",
                "account": "organization"
              }
            ]
          }
        },
        {
          "name": "employee"
        },
        {
          "name": "stream",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "employee"
              },
              {
                "kind": "arg",
                "path": "streamId"
              }
            ]
          }
        },
        {
          "name": "streamEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109,
                  45,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "stream"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "employeeTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "roles",
          "optional": true
        }
      ],
      "args": [
        {
          "name": "streamId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claim",
      "discriminator": [
        62,
        198,
        214,
        193,
        213,
        159,
        108,
        210
      ],
      "accounts": [
        {
          "name": "employee",
          "writable": true,
          "signer": true
        },
        {
          "name": "stream",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "stream.organization",
                "account": "stream"
              },
              {
                "kind": "account",
                "path": "stream.employee",
                "account": "stream"
              },
              {
                "kind": "account",
                "path": "stream.streamId",
                "account": "stream"
              }
            ]
          }
        },
        {
          "name": "streamEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109,
                  45,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "stream"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "employeeTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "consumeVaa",
      "discriminator": [
        224,
        143,
        180,
        192,
        139,
        120,
        177,
        63
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "crossChainConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  111,
                  115,
                  115,
                  45,
                  99,
                  104,
                  97,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "guardianSet",
          "docs": [
            "Guardian set derivation and validity are checked",
            "by the Wormhole verification shim."
          ]
        },
        {
          "name": "guardianSignatures",
          "docs": [
            "This account is created by post_signatures()",
            "and validated by the Wormhole verification shim."
          ]
        },
        {
          "name": "wormholeVerifyVaaShim",
          "address": "EFaNWErqAtVWufdNb7yofSHHfWFos843DFpu4JBw24at"
        },
        {
          "name": "consumedVaa",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "crossChainConfig.sourceEmitter",
                "account": "crossChainConfig"
              },
              {
                "kind": "arg",
                "path": "sequence"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "guardianSetBump",
          "type": "u8"
        },
        {
          "name": "sequence",
          "type": "u64"
        },
        {
          "name": "vaaBody",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "createOrganization",
      "discriminator": [
        60,
        173,
        177,
        39,
        122,
        23,
        68,
        185
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "organization",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createStream",
      "discriminator": [
        71,
        188,
        111,
        127,
        108,
        40,
        229,
        158
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "organization",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "organization.authority",
                "account": "organization"
              }
            ]
          }
        },
        {
          "name": "employee"
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "stream",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "employee"
              },
              {
                "kind": "arg",
                "path": "streamId"
              }
            ]
          }
        },
        {
          "name": "streamEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109,
                  45,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "stream"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "roles",
          "optional": true
        }
      ],
      "args": [
        {
          "name": "streamId",
          "type": "u64"
        },
        {
          "name": "totalAmount",
          "type": "u64"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "endTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "organization",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "organization.authority",
                "account": "organization"
              }
            ]
          }
        },
        {
          "name": "depositorTokenAccount",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "roles",
          "optional": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeCrossChainAction",
      "discriminator": [
        90,
        68,
        178,
        135,
        189,
        176,
        97,
        129
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "crossChainConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  111,
                  115,
                  115,
                  45,
                  99,
                  104,
                  97,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "consumedVaa",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "crossChainConfig.sourceEmitter",
                "account": "crossChainConfig"
              },
              {
                "kind": "arg",
                "path": "sequence"
              }
            ]
          }
        },
        {
          "name": "crossChainAssetConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  111,
                  115,
                  115,
                  45,
                  99,
                  104,
                  97,
                  105,
                  110,
                  45,
                  97,
                  115,
                  115,
                  101,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "organization",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "organization.authority",
                "account": "organization"
              }
            ]
          }
        },
        {
          "name": "employee"
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "crossChainStream",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  111,
                  115,
                  115,
                  45,
                  115,
                  116,
                  114,
                  101,
                  97,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "consumedVaa.streamId",
                "account": "consumedVaa"
              }
            ]
          }
        },
        {
          "name": "stream",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "employee"
              },
              {
                "kind": "arg",
                "path": "nativeStreamId"
              }
            ]
          }
        },
        {
          "name": "streamEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109,
                  45,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "stream"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "sequence",
          "type": "u64"
        },
        {
          "name": "nativeStreamId",
          "type": "u64"
        },
        {
          "name": "vaaBody",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "executeCrossChainTopUp",
      "discriminator": [
        122,
        223,
        219,
        61,
        78,
        59,
        70,
        186
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "crossChainConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  111,
                  115,
                  115,
                  45,
                  99,
                  104,
                  97,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "consumedVaa",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "crossChainConfig.sourceEmitter",
                "account": "crossChainConfig"
              },
              {
                "kind": "arg",
                "path": "sequence"
              }
            ]
          }
        },
        {
          "name": "crossChainStream",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  111,
                  115,
                  115,
                  45,
                  115,
                  116,
                  114,
                  101,
                  97,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "consumedVaa.streamId",
                "account": "consumedVaa"
              }
            ]
          }
        },
        {
          "name": "organization",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "organization.authority",
                "account": "organization"
              }
            ]
          }
        },
        {
          "name": "employee"
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "stream",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "employee"
              },
              {
                "kind": "arg",
                "path": "nativeStreamId"
              }
            ]
          }
        },
        {
          "name": "streamEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109,
                  45,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "stream"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "sequence",
          "type": "u64"
        },
        {
          "name": "nativeStreamId",
          "type": "u64"
        },
        {
          "name": "vaaBody",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "initializeCrossChainAssetConfig",
      "discriminator": [
        61,
        22,
        102,
        15,
        66,
        106,
        134,
        95
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocolConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "crossChainAssetConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  111,
                  115,
                  115,
                  45,
                  99,
                  104,
                  97,
                  105,
                  110,
                  45,
                  97,
                  115,
                  115,
                  101,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeCrossChainConfig",
      "discriminator": [
        162,
        136,
        180,
        13,
        95,
        156,
        67,
        223
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocolConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "crossChainConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  111,
                  115,
                  115,
                  45,
                  99,
                  104,
                  97,
                  105,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "sourceEmitter",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "initializeOrganizationRoles",
      "discriminator": [
        38,
        152,
        68,
        132,
        139,
        198,
        148,
        213
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "organization",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "roles",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110,
                  95,
                  114,
                  111,
                  108,
                  101,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        },
        {
          "name": "finance",
          "type": "pubkey"
        },
        {
          "name": "approver",
          "type": "pubkey"
        },
        {
          "name": "viewer",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initializeProtocol",
      "discriminator": [
        188,
        233,
        252,
        106,
        134,
        146,
        202,
        91
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocolConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeVault",
      "discriminator": [
        48,
        191,
        163,
        44,
        71,
        129,
        63,
        164
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "organization",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "topUpStream",
      "discriminator": [
        12,
        244,
        26,
        215,
        160,
        204,
        9,
        151
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "organization",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  103,
                  97,
                  110,
                  105,
                  122,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "organization.authority",
                "account": "organization"
              }
            ]
          }
        },
        {
          "name": "employee"
        },
        {
          "name": "stream",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "employee"
              },
              {
                "kind": "arg",
                "path": "streamId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "organization"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "streamEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  114,
                  101,
                  97,
                  109,
                  45,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "stream"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "roles",
          "optional": true
        }
      ],
      "args": [
        {
          "name": "streamId",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "consumedVaa",
      "discriminator": [
        191,
        28,
        148,
        127,
        15,
        13,
        25,
        110
      ]
    },
    {
      "name": "crossChainAssetConfig",
      "discriminator": [
        66,
        188,
        107,
        192,
        241,
        83,
        161,
        101
      ]
    },
    {
      "name": "crossChainConfig",
      "discriminator": [
        74,
        146,
        238,
        67,
        67,
        21,
        3,
        218
      ]
    },
    {
      "name": "crossChainStream",
      "discriminator": [
        239,
        81,
        97,
        211,
        89,
        177,
        49,
        163
      ]
    },
    {
      "name": "organization",
      "discriminator": [
        145,
        38,
        152,
        251,
        91,
        57,
        118,
        160
      ]
    },
    {
      "name": "organizationRoles",
      "discriminator": [
        60,
        58,
        194,
        123,
        201,
        195,
        80,
        65
      ]
    },
    {
      "name": "protocolConfig",
      "discriminator": [
        207,
        91,
        250,
        28,
        152,
        179,
        215,
        209
      ]
    },
    {
      "name": "stream",
      "discriminator": [
        166,
        224,
        59,
        4,
        202,
        10,
        186,
        83
      ]
    }
  ],
  "events": [
    {
      "name": "crossChainMessageConsumed",
      "discriminator": [
        92,
        45,
        99,
        138,
        29,
        212,
        110,
        74
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "alreadyPaused",
      "msg": "The protocol is already paused"
    },
    {
      "code": 6001,
      "name": "notPaused",
      "msg": "The protocol is not paused"
    },
    {
      "code": 6002,
      "name": "unauthorized",
      "msg": "The signer is not the protocol authority"
    },
    {
      "code": 6003,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6004,
      "name": "nothingToClaim",
      "msg": "There is nothing available to claim"
    },
    {
      "code": 6005,
      "name": "invalidStreamMint",
      "msg": "The stream mint does not match the provided mint"
    },
    {
      "code": 6006,
      "name": "alreadyCanceled",
      "msg": "The stream has already been canceled"
    },
    {
      "code": 6007,
      "name": "streamCanceled",
      "msg": "The stream has been canceled"
    },
    {
      "code": 6008,
      "name": "streamAlreadyStarted",
      "msg": "The stream has already started"
    },
    {
      "code": 6009,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6010,
      "name": "invalidCrossChainConfig",
      "msg": "The cross-chain configuration is invalid"
    },
    {
      "code": 6011,
      "name": "invalidVaaBody",
      "msg": "The VAA body is invalid"
    },
    {
      "code": 6012,
      "name": "invalidVaaSourceChain",
      "msg": "The VAA source chain is not trusted"
    },
    {
      "code": 6013,
      "name": "invalidVaaEmitter",
      "msg": "The VAA emitter is not trusted"
    },
    {
      "code": 6014,
      "name": "invalidVaaDestination",
      "msg": "The VAA destination chain is invalid"
    },
    {
      "code": 6015,
      "name": "invalidVaaPayload",
      "msg": "The VAA payload is invalid"
    },
    {
      "code": 6016,
      "name": "invalidVaaVersion",
      "msg": "The VAA payload version is invalid"
    },
    {
      "code": 6017,
      "name": "invalidVaaAction",
      "msg": "The VAA action is invalid"
    },
    {
      "code": 6018,
      "name": "invalidVaaSequence",
      "msg": "The VAA sequence does not match"
    }
  ],
  "types": [
    {
      "name": "consumedVaa",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "emitterChain",
            "type": "u16"
          },
          {
            "name": "emitterAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "sequence",
            "type": "u64"
          },
          {
            "name": "action",
            "type": "u8"
          },
          {
            "name": "operationId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "streamId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "u64"
          },
          {
            "name": "endTime",
            "type": "u64"
          },
          {
            "name": "payloadHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "consumedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "crossChainAssetConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "crossChainConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "sourceChain",
            "type": "u16"
          },
          {
            "name": "sourceEmitter",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "crossChainMessageConsumed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "emitterChain",
            "type": "u16"
          },
          {
            "name": "sequence",
            "type": "u64"
          },
          {
            "name": "action",
            "type": "u8"
          },
          {
            "name": "operationId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "streamId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "u64"
          },
          {
            "name": "endTime",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "crossChainStream",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "externalStreamId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nativeStreamId",
            "type": "u64"
          },
          {
            "name": "organization",
            "type": "pubkey"
          },
          {
            "name": "employee",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "operationId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "organization",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "organizationRoles",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "organization",
            "type": "pubkey"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "finance",
            "type": "pubkey"
          },
          {
            "name": "approver",
            "type": "pubkey"
          },
          {
            "name": "viewer",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "protocolConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "stream",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "organization",
            "type": "pubkey"
          },
          {
            "name": "employee",
            "type": "pubkey"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "escrow",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "streamId",
            "type": "u64"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "claimedAmount",
            "type": "u64"
          },
          {
            "name": "canceled",
            "type": "bool"
          },
          {
            "name": "cancelTime",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "consumedVaaSeed",
      "type": "bytes",
      "value": "[118, 97, 97]"
    },
    {
      "name": "crossChainAssetConfigSeed",
      "type": "bytes",
      "value": "[99, 114, 111, 115, 115, 45, 99, 104, 97, 105, 110, 45, 97, 115, 115, 101, 116]"
    },
    {
      "name": "crossChainConfigSeed",
      "type": "bytes",
      "value": "[99, 114, 111, 115, 115, 45, 99, 104, 97, 105, 110]"
    },
    {
      "name": "crossChainStreamSeed",
      "type": "bytes",
      "value": "[99, 114, 111, 115, 115, 45, 115, 116, 114, 101, 97, 109]"
    },
    {
      "name": "organizationSeed",
      "type": "bytes",
      "value": "[111, 114, 103, 97, 110, 105, 122, 97, 116, 105, 111, 110]"
    },
    {
      "name": "protocolConfigSeed",
      "type": "bytes",
      "value": "[112, 114, 111, 116, 111, 99, 111, 108]"
    },
    {
      "name": "protocolVersion",
      "type": "u8",
      "value": "1"
    },
    {
      "name": "streamEscrowSeed",
      "type": "bytes",
      "value": "[115, 116, 114, 101, 97, 109, 45, 101, 115, 99, 114, 111, 119]"
    },
    {
      "name": "streamSeed",
      "type": "bytes",
      "value": "[115, 116, 114, 101, 97, 109]"
    },
    {
      "name": "vaultAuthoritySeed",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116, 45, 97, 117, 116, 104, 111, 114, 105, 116, 121]"
    },
    {
      "name": "vaultSeed",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116]"
    },
    {
      "name": "wormholeSepoliaChainId",
      "type": "u16",
      "value": "10002"
    },
    {
      "name": "wormholeSolanaChainId",
      "type": "u16",
      "value": "1"
    }
  ]
};
