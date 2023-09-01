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

    // @spec encrypt(string(), public_key() | key_pair()) -> array_buffer().
    static async encrypt(str, key) {
        var buf = this.#s2ab(str);
        var array = [];
        var promiseArray = [];
        for (var i=0;i<=Math.floor((buf.byteLength-1)/214);i++) {
            promiseArray[i] = this.#encrypt(buf.slice(i*214, (i+1)*214), key);
        }
        for (var i=0;i<promiseArray.length;i++) {
            array[i] = await promiseArray[i];
        }
        var blob = new Blob(array);
        return await blob.arrayBuffer();
    }

    static #encrypt(data, key) {
        if (typeof key.publicKey !== 'undefined') {
            key = key.publicKey;
        }
        return window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP",
                //label: Uint8Array([...]) //optional
            },
            key, //from generate or import
            data //ArrayBuffer of data you want to encrypt
        );
    }

    // @spec decrypt(array_buffer(), private_key() | key_pair()) -> stirng().
    static async decrypt(data, key) {
        var array = [];
        var promiseArray = [];
        for (var i=0;i<data.byteLength/256;i++) {
            promiseArray[i] = this.#decrypt(data.slice(i*256, (i+1)*256), key);
        }
        for (var i=0;i<promiseArray.length;i++) {
            array[i] = await promiseArray[i];
        }
        var blob = new Blob(array);
        return this.#ab2s(await blob.arrayBuffer());
    }

    static async #decrypt(data, key) {
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
        return decrypted;
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
        return new TextEncoder().encode(src).buffer;
    }
    // @spec #ab2s(array_buffer()) -> string().
    static #ab2s(buf) {
        return new TextDecoder().decode(buf);
    }
}
