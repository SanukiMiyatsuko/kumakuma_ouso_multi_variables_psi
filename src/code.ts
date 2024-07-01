import { Options, headname } from "./App";
import { Z } from "./parse";

export type ZT = { readonly type: "zero" };
export type AT = { readonly type: "plus", readonly add: PT[] };
export type PT = { readonly type: "psi", readonly arr: T[] };
export type T = ZT | AT | PT;

// オブジェクトの相等判定
export function equal(s: T, t: T, lambda: number): boolean {
    if (s.type === "zero") {
        return t.type === "zero";
    } else if (s.type === "plus") {
        if (t.type !== "plus") return false;
        if (t.add.length !== s.add.length) return false;
        for (let i = 0; i < lambda; i++) {
            if (!equal(s.add[i], t.add[i], lambda)) return false;
        }
        return true;
    } else {
        if (t.type !== "psi") return false;
        for (let k = 0; k < lambda; k++) {
            if (!equal(s.arr[k], t.arr[k], lambda)) return false;
        }
        return true;
    }
}

export function psi(arr: T[]): PT {
    return { type: "psi", arr: arr };
}

// a+b を適切に整形して返す
export function plus(a: T, b: T): T {
    if (a.type === "zero") {
        return b;
    } else if (a.type === "plus") {
        if (b.type === "zero") {
            return a;
        } else if (b.type === "plus") {
            return { type: "plus", add: a.add.concat(b.add) };
        } else {
            return { type: "plus", add: [...a.add, b] };
        }
    } else {
        if (b.type === "zero") {
            return a;
        } else if (b.type === "plus") {
            return { type: "plus", add: [a, ...b.add] };
        } else {
            return { type: "plus", add: [a, b] };
        }
    }
}

// 要素が1個の配列は潰してから返す
export function sanitize_plus_term(add: PT[]): PT | AT {
    if (add.length === 1) {
        return add[0];
    } else {
        return { type: "plus", add: add };
    }
}

// s < t を判定
export function less_than(s: T, t: T, lambda: number): boolean {
    if (s.type === "zero") {
        return t.type !== "zero";
    } else if (s.type === "psi") {
        if (t.type === "zero") {
            return false;
        } else if (t.type === "psi") {
            for (let k = 0; k < t.arr.length; k++) {
                if (!equal(s.arr[k], t.arr[k], lambda)) return less_than(s.arr[k], t.arr[k], lambda);
            }
            return false;
        } else {
            return equal(s, t.add[0], lambda) || less_than(s, t.add[0], lambda);
        }
    } else {
        if (t.type === "zero") {
            return false;
        } else if (t.type === "plus") {
            const s2 = sanitize_plus_term(s.add.slice(1));
            const t2 = sanitize_plus_term(t.add.slice(1));
            return less_than(s.add[0], t.add[0], lambda) ||
                (equal(s.add[0], t.add[0], lambda) && less_than(s2, t2, lambda));
        } else {
            return less_than(s.add[0], t, lambda);
        }
    }
}

// dom(t)
export function dom(t: T, lambda: number): T {
    let oneArray = Array(lambda).fill(Z);
    const ONE = psi(oneArray);
    let omegaArray = Array(lambda).fill(Z);
    omegaArray[lambda-1] = ONE;
    const OMEGA = psi(omegaArray);
    if (t.type === "zero") {
        return Z;
    } else if (t.type === "plus") {
        return dom(t.add[t.add.length - 1], lambda);
    } else {
        let i_0 = lambda - 1;
        while (i_0 > -1) {
            if (!equal(t.arr[i_0], Z, lambda)) break;
            i_0--;
        }
        if (i_0 === -1) return ONE;
        const dom_i_0 = dom(t.arr[i_0], lambda);
        if (i_0 < lambda - 1 && equal(dom_i_0, ONE, lambda)) return t;
        if (i_0 === lambda - 1 && (equal(dom_i_0, ONE, lambda) || equal(dom_i_0, OMEGA, lambda))) return OMEGA;
        if (less_than(dom_i_0, t, lambda)) return dom_i_0;
        return OMEGA;
    }
}

// x[y]
export function fund(s: T, t: T, lambda: number): T {
    let oneArray = Array(lambda).fill(Z);
    const ONE = psi(oneArray);
    if (s.type === "zero") {
        return Z;
    } else if (s.type === "plus") {
        const lastfund = fund(s.add[s.add.length - 1], t, lambda);
        const remains = sanitize_plus_term(s.add.slice(0, s.add.length - 1));
        return plus(remains, lastfund);
    } else {
        let i_0 = lambda - 1;
        while (i_0 > -1) {
            if (!equal(s.arr[i_0], Z, lambda)) break;
            i_0--;
        }
        if (i_0 === -1) return Z;
        let sArray = [...s.arr];
        const dom_i_0 = dom(sArray[i_0], lambda);
        if (equal(dom_i_0, ONE, lambda)) {
            if (i_0 < lambda - 1) {
                return t;
            } else {
                if (equal(dom(t, lambda), ONE, lambda)) {
                    sArray[lambda - 1] = fund(s.arr[lambda - 1], Z, lambda);
                    return plus(fund(s, fund(t, Z, lambda), lambda), psi(sArray));
                } else {
                    return Z;
                }
            }
        } else {
            if (less_than(dom_i_0, s, lambda)) {
                sArray[i_0] = fund(s.arr[i_0], t, lambda);
                return psi(sArray);
            } else {
                if (dom_i_0.type !== "psi") throw Error("なんでだよ");
                let j_0 = lambda - 2;
                while (j_0 > -1) {
                    if (!equal(dom_i_0.arr[j_0], Z, lambda)) break;
                    j_0--;
                }
                let dom_i_0Array = [...dom_i_0.arr];
                dom_i_0Array[j_0] = fund(dom_i_0.arr[j_0], Z, lambda);
                if (equal(dom(t, lambda), ONE, lambda), lambda) {
                    const p = fund(s, fund(t, Z, lambda), lambda);
                    if (p.type !== "psi") throw Error("なんでだよ");
                    const Gamma = p.arr[i_0];
                    dom_i_0Array[j_0 + 1] = Gamma;
                    sArray[i_0] = fund(s.arr[i_0], psi(dom_i_0Array), lambda);
                    return psi(sArray);
                } else {
                    sArray[i_0] = fund(s.arr[i_0], psi(dom_i_0Array), lambda);
                    return psi(sArray);
                }
            }
        }
    }
}

// ===========================================
// オブジェクトから文字列へ
export function term_to_string(t: T, option: Options, lambda: number): string {
    if (t.type === "zero") {
        return "0";
    } else if (t.type === "psi") {
        if (!option.checkOnOffF) {
            while (t.arr[t.arr.length-1].type === "zero") {
                t = psi(t.arr.slice(0, t.arr.length - 1));
            }
        }
        let str = headname;
        if (option.checkOnOffA && t.arr.length > 1) {
            if (option.checkOnOffB || option.checkOnOffT) {
                str = str + "_{" + term_to_string(t.arr[0], option, lambda) + "}(";
            } else {
                let oneArray = Array(lambda).fill(Z);
                const ONE = psi(oneArray);
                let omegaArray = Array(lambda).fill(Z);
                omegaArray[lambda-1] = ONE;
                const OMEGA = psi(omegaArray);
                let lOmegaArray = Array(lambda).fill(Z);
                lOmegaArray[lambda-2] = ONE;
                const LOMEGA = psi(lOmegaArray);
                let iotaArray = Array(lambda).fill(Z);
                iotaArray[lambda-3] = ONE;
                const IOTA = psi(iotaArray);
                if (t.arr[0].type === "zero") {
                    str = str + "_0(";
                } else if (t.arr[0].type === "plus") {
                    if (t.arr[0].add.every((x) => equal(x, ONE, lambda))) {
                        str = str + "_" + term_to_string(t.arr[0], option, lambda) + "(";
                    } else {
                        str = str + "_{" + term_to_string(t.arr[0], option, lambda) + "}(";
                    }
                } else {
                    if (equal(t.arr[0], ONE, lambda) || equal(t.arr[0], OMEGA, lambda) || equal(t.arr[0], LOMEGA, lambda) || equal(t.arr[0], IOTA, lambda)) {
                        str = str + "_" + term_to_string(t.arr[0], option, lambda) + "(";
                    } else {
                        str = str + "_{" + term_to_string(t.arr[0], option, lambda) + "}(";
                    }
                }
            }
        } else if (t.arr.length === 1) {
            return str + "(" + term_to_string(t.arr[0], option, lambda) + ")";
        } else {
            str = str + "(" + term_to_string(t.arr[0], option, lambda) + ",";
        }
        str = str + term_to_string(t.arr[1], option, lambda);
        for (let i = 2; i < t.arr.length; i++) {
            str = str + "," + term_to_string(t.arr[i], option, lambda);
        }
        return str + ")";
    } else {
        return t.add.map((x) => term_to_string(x, option, lambda)).join("+");
    }
}

export function abbrviate(str: string, option: Options, lambda: number): string {
    str = str.replace(RegExp(headname + "\\(0\\)", "g"), "1");
    str = str.replace(RegExp(headname + "_\\{0\\}\\(0\\)", "g"), "1");
    str = str.replace(RegExp(headname + "_0\\(0\\)", "g"), "1");
    str = str.replace(RegExp(headname + "\\(0,0\\)", "g"), "1");
    let zerostr = "";
    for (let i = 2; i < lambda; i++) {
        zerostr = zerostr + ",0";
    }
    str = str.replace(RegExp(headname + "_\\{0\\}\\(0" + zerostr + "\\)", "g"), "1");
    str = str.replace(RegExp(headname + "_0\\(0" + zerostr + "\\)", "g"), "1");
    str = str.replace(RegExp(headname + "\\(0,0" + zerostr + "\\)", "g"), "1");
    if (option.checkOnOffo) {
        str = str.replace(RegExp(headname + "\\(1\\)", "g"), "ω");
        str = str.replace(RegExp(headname + "_\\{0\\}\\(1\\)", "g"), "ω");
        str = str.replace(RegExp(headname + "_0\\(1\\)", "g"), "ω");
        str = str.replace(RegExp(headname + "\\(0,1\\)", "g"), "ω");
        let zerostr = "";
        for (let i = 2; i < lambda-1; i++) {
            zerostr = zerostr + ",0";
        }
        str = str.replace(RegExp(headname + "_\\{0\\}\\(0" + zerostr + ",1\\)", "g"), "ω");
        str = str.replace(RegExp(headname + "_0\\(0" + zerostr + ",1\\)", "g"), "ω");
        str = str.replace(RegExp(headname + "\\(0,0" + zerostr + ",1\\)", "g"), "ω");
    }
    if (option.checkOnOffO) {
        str = str.replace(RegExp(headname + "_\\{1\\}\\(0\\)", "g"), "Ω");
        str = str.replace(RegExp(headname + "_1\\(0\\)", "g"), "Ω");
        str = str.replace(RegExp(headname + "\\(1,0\\)", "g"), "Ω");
        str = str.replace(RegExp(headname + "_\\{0\\}\\(1,0\\)", "g"), "Ω");
        str = str.replace(RegExp(headname + "_0\\(1,0\\)", "g"), "Ω");
        str = str.replace(RegExp(headname + "\\(0,1,0\\)", "g"), "Ω");
        let zerostr = "";
        for (let i = 2; i < lambda-2; i++) {
            zerostr = zerostr + ",0";
        }
        str = str.replace(RegExp(headname + "_\\{0\\}\\(0" + zerostr + ",1,0\\)", "g"), "Ω");
        str = str.replace(RegExp(headname + "_0\\(0" + zerostr + ",1,0\\)", "g"), "Ω");
        str = str.replace(RegExp(headname + "\\(0,0" + zerostr + ",1,0\\)", "g"), "Ω");
    }
    if (option.checkOnOffI) {
        str = str.replace(RegExp(headname + "_\\{1\\}\\(0,0\\)", "g"), "I");
        str = str.replace(RegExp(headname + "_1\\(0,0\\)", "g"), "I");
        str = str.replace(RegExp(headname + "\\(1,0,0\\)", "g"), "I");
        str = str.replace(RegExp(headname + "_\\{0\\}\\(1,0,0\\)", "g"), "I");
        str = str.replace(RegExp(headname + "_0\\(1,0,0\\)", "g"), "I");
        str = str.replace(RegExp(headname + "\\(0,1,0,0\\)", "g"), "I");
        let zerostr = "";
        for (let i = 2; i < lambda-3; i++) {
            zerostr = zerostr + ",0";
        }
        str = str.replace(RegExp(headname + "_\\{0\\}\\(0" + zerostr + ",1,0,0\\)", "g"), "I");
        str = str.replace(RegExp(headname + "_0\\(0" + zerostr + ",1,0,0\\)", "g"), "I");
        str = str.replace(RegExp(headname + "\\(0,0" + zerostr + ",1,0,0\\)", "g"), "I");
    }
    if (option.checkOnOffT) str = to_TeX(str);
    while (true) {
        const numterm = str.match(/1(\+1)+/);
        if (!numterm) break;
        const matches = numterm[0].match(/1/g);
        if (!matches) throw Error("そんなことある？");
        const count = matches.length;
        str = str.replace(numterm[0], count.toString());
    }
    return str;
}

function to_TeX(str: string): string {
    str = str.replace(RegExp(headname, "g"), "\\textrm{" + headname + "}");
    str = str.replace(/ω/g, "\\omega");
    str = str.replace(/Ω/g, "\\Omega");
    str = str.replace(/I/g, "\\textrm{I}");
    return str;
}