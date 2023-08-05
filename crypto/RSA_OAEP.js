class RSA_OAEP {
    // @type key_pair() ::
    //       {publicKey: public_key(), privateKey: private_key()}

    // @spec generate(Extractable::boolean()) -> key_pair().
    static generate(isExtractable) {
        const ec = {
            name: "RSA-OAEP",
            modulusLength: 2048, //can be 1024, 2048, or 4096
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: {name: "SHA-1"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        };
        const usage = ["encrypt", "decrypt"];
        return crypto.subtle.generateKey(ec, isExtractable, usage);
    }

    // @spec encrypt(object(), public_key() | key_pair()) -> array_buffer().
    static encrypt(data, key) {
        if (typeof key.publicKey !== 'undefined') {
            key = key.publicKey;
        }
        return window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP",
                //label: Uint8Array([...]) //optional
            },
            key, //from generate or import
            this.#s2ab(JSON.stringify(data)) //ArrayBuffer of data you want to encrypt
        );
    }

    // @spec decrypt(array_buffer(), private_key() | key_pair()) -> object().
    static async decrypt(data, key) {
        if (typeof key.privateKey !== 'undefined') {
            key = key.privateKey;
        }
        var decrypted = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP",
                //label: Uint8Array([...]) //optional
            },
            key, //from generateKey or importKey above
            data //ArrayBuffer of the data
        );
        return JSON.parse(this.#ab2s(decrypted));
    }

    // @spec import(public_jwk_map())  -> public_key();
    //             (private_jwk_map()) -> private_key().
    static import(key) {
        return window.crypto.subtle.importKey(
            "jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
            key,
            {   //these are the algorithm options
                name: "RSA-OAEP",
                hash: {name: "SHA-1"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
            },
            key.ext, //whether the key is extractable (i.e. can be used in exportKey)
            key.key_ops //"encrypt" or "wrapKey" for public key import or
                        //"decrypt" or "unwrapKey" for private key imports
        )
    }

    // @spec export(public_key())  -> public_jwk_map();
    //             (private_key()) -> private_jwk_map().
    static export(key) {
        return window.crypto.subtle.exportKey(
            "jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
            key //can be a publicKey or privateKey, as long as extractable was true
        )
    }

    // @spec #s2ab(string()) -> array_buffer().
    static #s2ab(src) {
        return (new Uint8Array([].map.call(src, function(c) {
            return c.charCodeAt(0)
        }))).buffer;
    }
    // @spec #ab2s(array_buffer()) -> string().
    static #ab2s(buf) {
        var tmp = [];
        var len = 1024;
        for (var p = 0; p < buf.byteLength; p += len) {
            tmp.push(String.fromCharCode.apply("", new Uint8Array(
                buf.slice(p, p + len)
            )));
        }
        return tmp.join("");
    }
}
