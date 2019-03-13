//{"target":{"type":"user"},"locks":[{"path":"hasId","args":["$owner"]}]
//path of agile-security
var path = process.cwd();

module.exports = {
  "storage": {
    "dbName": "database_"
  },
  upfront_storage: {
    module_name: "agile-upfront-leveldb",
    type: "external",
    dbName: "database_",
    collection: "policies"
  },
  upfront_locks: path + "/node_modules/agile-upfront-locks/Locks",
  upfront_actions: path + "/node_modules/agile-upfront-locks/Actions",
  /*upfront_locks: __dirname + "/../node_modules/agile-upfront-locks/Locks",
  upfront_actions: __dirname + "/../node_modules/agile-upfront-locks/Actions",*/
  "policies": {
    "create_entity_policy": [
      // actions of an actor are not restricted a priori
      {
        op: "write"
      },
      {
        op: "read"
      }
    ],
    "top_level_policy": {
      flows: [
        // all properties can be read by everyone
        {
          op: "read"
        },
        // all properties can only be changed by the owner of the entity
        {
          op: "write",
          locks: [{
            lock: "hasType",
            args: ["/user"]
          }, {
            lock: "isOwner"
          }]
        },
        {
          op: "write",
          locks: [{
            lock: "hasType",
            args: ["/user"]
          }, {
            lock: "attrEq",
            args: ["role", "admin"]
          }]
        }

      ],
      //specify what should happen if the policy does not comply
      actions: {
        "read": [{
          action: "delete"
        }]
      }
    },
    //default policy for policy field
    "policy-policy-root": {
      attribute: "policies",
      policy: [{
          op: "read"
        },
        {
          op: "write",
          locks: [{
            lock: "hasType",
            args: ["/user"]
          }, {
            lock: "isOwner"
          }]
        },
        // by all users with role admin
        {
          op: "write",
          locks: [{
            lock: "hasType",
            args: ["/user"]
          }, {
            lock: "attrEq",
            args: ["role", "admin"]
          }]
        }
      ],
      readAll: [{
        op: "read"
      }]
    },
    //restricts the policy composition tree (policy.policy) read only  = 1 (policy.policy.policy) = 2
    //in other terms 1 does not allow for policy updates, 2 allows for policy update but no meta-policy update, etc.
    "policy-level": 2,
    "action-policy-root": {
      attribute: "actions",
      policy: [{
          op: "read",
          locks: [{
            lock: "hasType",
            args: ["/user"]
          }, {
            lock: "isOwner"
          }]
        },
        // by all users with role admin
        {
          op: "read",
          locks: [{
            lock: "hasType",
            args: ["/user"]
          }, {
            lock: "attrEq",
            args: ["role", "admin"]
          }]
        },
        {
          op: "write",
          locks: [{
            lock: "hasType",
            args: ["/user"]
          }, {
            lock: "isOwner"
          }]
        },
        // by all users with role admin
        {
          op: "write",
          locks: [{
            lock: "hasType",
            args: ["/user"]
          }, {
            lock: "attrEq",
            args: ["role", "admin"]
          }]
        }
      ]
    },
    "attribute_level_policies": {
      "user": {
        "password": [
          // the property can only be read by the user itself
          {
            op: "read",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "isOwner"
            }]
          }
          // the property can be set by the user itself and
          , {
            op: "write",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "isOwner"
            }]
          },
          // by all users with role admin
          {
            op: "write",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "attrEq",
              args: ["role", "admin"]
            }]
          }
        ],
        "role": [
          // can be read by everyone
          {
            op: "read"
          },
          // can only be changed by users with role admin
          {
            op: "write",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "attrEq",
              args: ["role", "admin"]
            }]
          }
        ],
        "policies.role": [
          // can be read by everyone
          {
            op: "read"
          },
          // can only be changed by users with role admin
          {
            op: "write",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "attrEq",
              args: ["role", "admin"]
            }]
          }
        ],
        "credentials": [{
            op: "read",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "isOwner"
            }]
          },
          {
            op: "write",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "isOwner"
            }]
          }
        ],
        "policies.credentials": [{
            op: "read"
          },
          {
            op: "write",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "isOwner"
            }]
          }
        ]
      },
      "client": {
        "clientSecret": [{
            op: "read",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "isOwner"
            }]
          },
          {
            op: "write",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "isOwner"
            }]
          }
        ],
        "policies.clientSecret": [{
            op: "read"
          },
          {
            op: "write",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "isOwner"
            }]
          }
        ]
      },
      "device": {
        "credentials": [
          // the property can only be read by the user itself
          {
            op: "read",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "isOwner"
            }]
          },
          // the property can be set by the user itself and
          {
            op: "write",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "isOwner"
            }]
          }
        ],
        "policies.credentials": [{
            op: "read"
          },
          {
            op: "write",
            locks: [{
              lock: "hasType",
              args: ["/user"]
            }, {
              lock: "isOwner"
            }]
          }
        ]
      }
    }
  },

  "forbidden-attribute-names": [
    'id',
    'type',
    'owner',
    'groups',
    'entities',
    'actions',
    'policies'
  ],
  "schema-validation": [{
    "id": "/device",
    "additionalProperties": false,
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "credentials": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "dropbox": {
            "type": "string"
          }
        }
      }

    },
    "required": ["name"]
  }, {
    "id": "/user",
    "additionalProperties": true,
    "type": "object",
    "properties": {
      "user_name": {
        "type": "string"
      },
      "auth_type": {
        "type": "string"
      },
      "password": {
        "type": "string"
      },
      "role": {
        "type": "string"
      },
      "credentials": {
        "type": "object",
        "additionalProperties": true
      }
    },
    "required": ["user_name", "auth_type"]
  }, {
    "id": "/client",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "name": {
        "type": "string"
      },
      "clientSecret": {
        "type": "string"
      },
      "redirectURI": {
        "type": "string"
      }
    },
    "required": ["name"]
  }, {
    "id": "/gateway",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "name": {
        "type": "string"
      }
    },
    "required": ["name"]
  }, {
    "id": "/database",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "host": {
        "type": "string"
      },
      "port": {
        "type": "integer"
      },
      "user": {
        "type": "string"
      },
      "password": {
        "type": "string"
      },
      "database": {
        "type": "string"
      }
    },
    "required": ["host", "port", "user", "password", "database"]
  }],
  "configure_on_boot": {
    "user": [{
      "user_name": "bob",
      "auth_type": "local",
      "role": "admin",
      "password": "secret"
    }],
    "client": [{
      "id": "MyAgileClient2",
      "name": "MyAgileClient2",
      "clientSecret": "Ultrasecretstuff",
      "redirectURI": "http://localhost:3002/auth/example/callback"
    }, {
      "id": "mysqlDB",
      "name": "mysqlDB",
      "clientSecret": "Ultrasecretstuff",
      "redirectURI": "http://set-automatically:3002/auth/example/callback"
    }],
    "gateway": [{
      "id": "self",
      "name": "local gateway"
    }]
  },
  "audit": {
    dbName: "database_",
    //according to https://www.npmjs.com/package/timeframe-to-seconds,
    timeframe: '1m',
    //DETAILED=0, ONLY_IMPORTANT_STUFF=1
    level: 1,
    regex: '^actions'
    //regex in case we want to log only certain
  }
};
