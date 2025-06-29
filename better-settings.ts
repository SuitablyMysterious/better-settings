/* ----------------------------------------------------------
   Better-Settings – extra blocks layered on top of the
   official Settings Blocks extension.
   ---------------------------------------------------------- */

/*
 *  █████  ██████  ████████ ████████ ████████ ██    ██
 * ██   ██ ██   ██    ██       ██       ██     ██  ██
 * ███████ ██████     ██       ██       ██      ████
 * ██   ██ ██   ██    ██       ██       ██     ██  ██
 * ██   ██ ██   ██    ██       ██       ██    ██    ██
 *
 *      github.com/SuitablyMysterious/better-settings
 */

/* -------------------------------------------------- */
/* 1.  TILEMAP SUPPORT (write / read)                 */
/* -------------------------------------------------- */

// We extend the SAME namespace so the blocks show up under
// Settings → Arrays beside the official writeNumberArray.
namespace settings {
    /**
     * Save **tilemap** under **name** (writes its raw buffer as hex).
     */
    //% blockId=bs_write_tilemap
    //% block="set setting $name to tilemap $map"
    //% group="Arrays"
    //% name.shadow=text
    //% weight=45
    export function writeTilemap(name: string, map: tiles.TileMapData): void {
        const buf = (map as any).data as Buffer;
        if (buf) writeString(name, buf.toHex());
    }

    /**
     * Read a tilemap previously saved with *writeTilemap*.
     * Returns **null** if the key does not exist.
     *
     * @param tileset must be the SAME order used when saving.
     */
    //% blockId=bs_read_tilemap
    //% block="read setting $name as tilemap using tileset $tileset=variables_get(myTileset)||array"
    //% group="Arrays"
    //% name.shadow=text
    //% handlerReturns=tilemap
    //% weight=44
    export function readTilemap(
        name: string,
        tileset: Image[],
        scale: TileScale = TileScale.Sixteen
    ): tiles.TileMapData {
        if (!exists(name)) return null;

        const buf = Buffer.fromHex(readString(name));
        const w = buf.getNumber(NumberFormat.UInt16LE, 0);
        const h = buf.getNumber(NumberFormat.UInt16LE, 2);
        const base = image.create(w, h);

        return tiles.createTilemap(buf, base, tileset, scale);
    }
}

/* -------------------------------------------------- */
/* 2.  STRING[]                                       */
/* -------------------------------------------------- */
namespace settings {
    /**
     * Save a **string array** under *name* (JSON-encoded).
     */
    //% blockId=bs_write_str_array
    //% block="set setting $name to string array $arr"
    //% group="Arrays"
    //% name.shadow=text
    //% arr.shadow=lists_create_with
    //% weight=42
    export function writeStringArray(name: string, arr: string[]): void {
        writeString(name, JSON.stringify(arr || []));
    }

    /**
     * Read a **string array**; returns `[]` if key missing.
     */
    //% blockId=bs_read_str_array
    //% block="read setting $name as string array"
    //% group="Arrays"
    //% name.shadow=text
    //% handlerReturns=Array
    //% weight=41
    export function readStringArray(name: string): string[] {
        return exists(name) ? JSON.parse(readString(name)) : [];
    }
}

/* -------------------------------------------------- */
/* 3.  BOOLEAN[]   (bit-packed to save flash)         */
/* -------------------------------------------------- */
namespace settings {
    /**
     * Save a boolean array (packed 8 flags per byte).
     */
    //% blockId=bs_write_bool_array
    //% block="set setting $name to boolean array $arr"
    //% group="Arrays"
    //% name.shadow=text
    //% arr.shadow=lists_create_with
    //% arr.defl=true
    //% weight=39
    export function writeBooleanArray(name: string, arr: boolean[]): void {
        const len = arr ? arr.length : 0;
        const buf = control.createBuffer(1 + Math.ceil(len / 8));
        buf.setNumber(NumberFormat.UInt16LE, 0, len);
        for (let i = 0; i < len; ++i) {
            const byte = 1 + (i >> 3);
            if (arr[i]) buf[byte] |= 1 << (i & 7);
        }
        writeString(name, buf.toHex());
    }

    /**
     * Read a boolean array that was packed by *writeBooleanArray*.
     */
    //% blockId=bs_read_bool_array
    //% block="read setting $name as boolean array"
    //% group="Arrays"
    //% name.shadow=text
    //% handlerReturns=Array
    //% weight=38
    export function readBooleanArray(name: string): boolean[] {
        if (!exists(name)) return [];
        const buf = Buffer.fromHex(readString(name));
        const len = buf.getNumber(NumberFormat.UInt16LE, 0);
        const out: boolean[] = [];
        for (let i = 0; i < len; ++i) {
            const byte = 1 + (i >> 3);
            out.push((buf[byte] & (1 << (i & 7))) !== 0);
        }
        return out;
    }
}

/* -------------------------------------------------- */
/* 4.  load-or-default helpers                        */
/* -------------------------------------------------- */
namespace settings {
    /**
     * Read **number** or return *fallback*.
     */
    //% blockId=bs_num_default
    //% block="read number setting $name or default $def"
    //% group="Operations"
    //% name.shadow=text
    //% weight=28
    export function readNumberOrDefault(name: string, def: number): number {
        return exists(name) ? readNumber(name) : def;
    }

    /**
     * Read **string** or return *fallback*.
     */
    //% blockId=bs_str_default
    //% block="read string setting $name or default $def"
    //% group="Operations"
    //% name.shadow=text
    //% def.shadow=text
    //% weight=27
    export function readStringOrDefault(name: string, def: string): string {
        return exists(name) ? readString(name) : def;
    }
}

/* -------------------------------------------------- */
/* 5.  Diagnostics                                    */
/* -------------------------------------------------- */
namespace settings {
    /**
     * Return approximate bytes used by ALL non-system keys.
     */
    //% blockId=bs_storage_used
    //% block="storage used (bytes)"
    //% group="Operations"
    //% weight=15
    export function storageUsed(): number {
        let total = 0;
        for (const k of list("")) {
            total += readString(k).length; // 1 char = 1 byte in flash
        }
        return total;
    }

    /**
     * Return an array of all keys that start with *prefix*.
     */
    //% blockId=bs_list_keys
    //% block="array of settings names with prefix $prefix"
    //% group="Operations"
    //% prefix.shadow=text
    //% handlerReturns=Array
    //% weight=14
    export function listKeys(prefix: string): string[] {
        return list(prefix);
    }
}
