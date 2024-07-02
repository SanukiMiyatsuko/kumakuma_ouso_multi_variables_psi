import React, { useState } from "react";
import './App.css';
import { T, abbrviate, dom, equal, fund, less_than, plus, psi, sanitize_plus_term, term_to_string } from "./code";
import { Scanner, Z } from "./parse";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type Operation = "fund" | "dom" | "less_than";

export type Options = {
  checkOnOffo: boolean;
  checkOnOffO: boolean;
  checkOnOffI: boolean;
  checkOnOffF: boolean;
  checkOnOffA: boolean;
  checkOnOffB: boolean;
  checkOnOffT: boolean;
  showHide: boolean;
};

export const headname: string = "ψ";
export const headnamereplace: string = "p";

function variable_length(s: T): number {
  if (s.type === "zero") {
      return 1;
  } else if (s.type === "plus") {
      const addArray = s.add.map((x) => variable_length(x));
      const aryMax = (a: number, b: number) => Math.max(a, b);
      return addArray.reduce(aryMax);
  } else {
      const Array = s.arr.map((x) => variable_length(x));
      const aryMax = (a: number, b: number) => Math.max(a, b);
      const maxnumber = Array.reduce(aryMax);
      return Math.max(Array.length, maxnumber);
  }
}

function equalize_bool(s: T, n: number): boolean {
  if (s.type === "zero") {
      return true;
  } else if (s.type === "plus") {
      return s.add.every((x) => (equalize_bool(x, n)));
  } else {
      if (s.arr.length !== n) return false;
      if (s.arr.every((x) => (equal(x, Z, n)))) return true;
      return s.arr.every((x) => (equalize_bool(x, n)));
  }
}

function equalize(s: T, n: number): T {
  if (s.type === "zero") {
      return Z;
  } else if (s.type === "plus") {
      const a = s.add[0];
      const b = sanitize_plus_term(s.add.slice(1));
      return plus(equalize(a, n), equalize(b, n));
  } else {
      if (s.arr.length === n) {
          if (!s.arr.every((x) => equalize_bool(x, n))) {
              return psi(s.arr.map((x) => equalize(x, n)));
          } else {
              return s;
          }
      } else {
          if (!s.arr.every((x) => equalize_bool(x, n))) {
              let sarr = s.arr.map((x) => equalize(x, n));
              const t = Array(n - s.arr.length).fill(Z);
              return psi(t.concat(sarr));
          } else {
              const t = Array(n - s.arr.length).fill(Z);
              return psi(t.concat(s.arr));
          }
      }
  }
}

function App() {
  const [inputstrA, setInputA] = useState("");
  const [inputstrB, setInputB] = useState("");
  const [Output, setOutput] = useState("出力：");
  const [outputError, setOutputError] = useState("");
  const [options, setOptions] = useState<Options>({
    checkOnOffo: false,
    checkOnOffO: false,
    checkOnOffI: false,
    checkOnOffF: false,
    checkOnOffA: false,
    checkOnOffB: false,
    checkOnOffT: false,
    showHide: false,
  });

  const compute = (operation: Operation) => {
    setOutput("");
    setOutputError("");
    try {
      const x = new Scanner(inputstrA).parse_term();
      const y = inputstrB ? new Scanner(inputstrB).parse_term() : null;

      const xLength: number = variable_length(x);
      let yLength: number = 1;
      if (y !== null) yLength = variable_length(y);
      const maxLength: number = Math.max(xLength, yLength);
      const xEqualize: T = equalize(x, maxLength);
      let yEqualize: T = Z;
      if (y !== null) yEqualize = equalize(y, maxLength);

      let result;
      switch (operation) {
        case "fund":
          if (y === null) throw new Error("Bの入力が必要です");
          result = fund(xEqualize, yEqualize, maxLength);
          break;
        case "dom":
          result = dom(xEqualize, maxLength);
          break;
        case "less_than":
          if (y === null) throw new Error("Bの入力が必要です");
          setOutput(`出力：${less_than(xEqualize, yEqualize, maxLength) ? "真" : "偽"}`);
          return;
        default:
          throw new Error("不明な操作");
      }

      const outputString = abbrviate(term_to_string(result, options, maxLength), options, maxLength);
      setOutput(`出力：${options.checkOnOffT ? `$${outputString}$` : outputString}`);
    } catch (error) {
      if (error instanceof Error) setOutputError(error.message);
      else setOutputError("不明なエラー");
    }
  };

  const handleCheckboxChange = (key: keyof Options) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      [key]: !prevOptions[key],
    }));
  };

  return (
    <div className="Appb">
      <h1 className="App">くまくま(大嘘)多変数ψ計算機</h1>
      <p className="Appa">
        入力は{headname}(a_n,a_&#123;n-1&#125;,...,a_3,a_2,a_1), {headname}_&#123;a_n&#125;(a_&#123;n-1&#125;,...,a_3,a_2,a_1)の形式で行ってください。<br />
        nは固定でなくても大丈夫です。<br />
        _, &#123;, &#125;は省略可能です。<br />
        略記として、1 := {headname}(0,0,...,0,0,0), n := 1 + 1 + ...(n個の1)... + 1, ω := {headname}(0,0,...,0,0,1), Ω := {headname}(0,0,...,0,1,0), I := {headname}(0,0,...,1,0,0)が使用可能。<br />
        また、{headname}は"{headnamereplace}"で、ωはwで、ΩはWで、Iはiで代用可能。
      </p>
      <div className="block">
        A:
        <input
          id="inputA"
          className="input is-primary"
          value={inputstrA}
          onChange={(e) => setInputA(e.target.value)}
          type="text"
          placeholder="入力A"
        />
        B:
        <input
          id="inputB"
          className="input is-primary"
          value={inputstrB}
          onChange={(e) => setInputB(e.target.value)}
          type="text"
          placeholder="入力B"
        />
      </div>
      <div className="block">
        <button onClick={() => compute("fund")} className="button is-primary">
          A[B]を計算
        </button>
        <button onClick={() => compute("dom")} className="button is-primary">
          dom(A)を計算
        </button>
        <button onClick={() => compute("less_than")} className="button is-primary">
          A &lt; Bか判定
        </button>
      </div>
      <input type="button" value="オプション" onClick={() => handleCheckboxChange('showHide')} className="button is-primary is-light is-small" />
      {options.showHide ? (
        <ul>
          <li><label className="checkbox">
            <input type="checkbox" checked={options.checkOnOffo} onChange={() => handleCheckboxChange('checkOnOffo')} />
            {headname}(0,0,...,0,0,1)をωで出力
          </label></li>
          <li><label className="checkbox">
            <input type="checkbox" checked={options.checkOnOffO} onChange={() => handleCheckboxChange('checkOnOffO')} />
            {headname}(0,0,...,0,1,0)をΩで出力
          </label></li>
          <li><label className="checkbox">
            <input type="checkbox" checked={options.checkOnOffI} onChange={() => handleCheckboxChange('checkOnOffI')} />
            {headname}(0,0,...,1,0,0)をIで出力
          </label></li>
          <li><label className="checkbox">
            <input type="checkbox" checked={options.checkOnOffF} onChange={() => handleCheckboxChange('checkOnOffF')} />
            変数の個数を固定して表示
          </label></li>
          <li><label className="checkbox">
            <input type="checkbox" checked={options.checkOnOffA} onChange={() => handleCheckboxChange('checkOnOffA')} />
            {headname}(a_n,a_&#123;n-1&#125;,...,a_3,a_2,a_1)を{headname}_&#123;a_n&#125;(a_n,a_&#123;n-1&#125;,...,a_3,a_2,a_1)で表示
          </label></li>
          {options.checkOnOffA ? (
            <li><ul><li><label className="checkbox">
              <input type="checkbox" checked={options.checkOnOffB} onChange={() => handleCheckboxChange('checkOnOffB')} />
              全ての&#123; &#125;を表示
            </label></li></ul></li>
          ) : (
            <></>
          )}
          <li><label className="checkbox">
            <input type="checkbox" checked={options.checkOnOffT} onChange={() => handleCheckboxChange('checkOnOffT')} />
            TeXで出力
          </label></li>
        </ul>
      ) : (
        <></>
      )}
      <div className="box is-primary">
        {outputError !== "" ? (
          <div className="notification is-danger">{outputError}</div>
        ) : (
          <div className="Appa">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {Output}
            </ReactMarkdown>
          </div>
        )}
      </div>
      <p>
        <a href="https://googology.fandom.com/ja/wiki/%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E3%83%96%E3%83%AD%E3%82%B0:Mitsuki1729/%E8%A9%A6%E4%BD%9C:%E3%81%8F%E3%81%BE%E3%81%8F%E3%81%BE(%E5%A4%A7%E5%98%98)%E5%A4%9A%E5%A4%89%E6%95%B0%CE%A8" target="_blank" rel="noreferrer">Definition of "Kumakuma Ouso Multi Variables ψ"</a> by <a href="https://googology.fandom.com/ja/wiki/%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC:Mitsuki1729" target="_blank" rel="noreferrer">Mitsuki1729</a>, Retrieved 2020/10/12 <br />
        The program <a href="https://github.com/SanukiMiyatsuko/kumakuma_ouso_multi_variables_psi" target="_blank" rel="noreferrer">https://github.com/SanukiMiyatsuko/kumakuma_ouso_multi_variables_psi</a> is licensed by <a href="https://creativecommons.org/licenses/by-sa/3.0/legalcode" target="_blank" rel="noreferrer">Creative Commons Attribution-ShareAlike 3.0 Unported License</a>.<br />
        Last updated: 2024/07/02
      </p>
    </div>
  );
}

export default App;