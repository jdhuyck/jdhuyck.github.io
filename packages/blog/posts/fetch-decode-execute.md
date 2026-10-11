---
title: What actually happens in the fetch–decode–execute cycle?
date: 2026-10-10
summary: Following one instruction through the CPU, register by register, using the simulator in the lab.
category: curriculum-design
levels: [GCSE, A Level]
tags: [systems architecture, cpu, registers]
draft: true
---

Every program you have ever run, from a game to the code you wrote last lesson, is carried out by the CPU repeating three steps: **fetch** an instruction from memory, **decode** it, then **execute** it.

The simulator in the [lab](/lab#cpu) runs a three-line program. This post walks through the first instruction slowly.

## The program

```lmc
0  LDA 5    ; load the value at address 5 into the accumulator
1  ADD 6    ; add the value at address 6
2  STA 7    ; store the result at address 7
3  HLT
5  3
6  4
```

Instructions and data sit side by side in the same memory. That is the key idea of the **Von Neumann architecture**.

> [!KEYWORD]
> **Von Neumann architecture**: a design where program instructions and data are stored together in the same memory, and fetched along the same buses.

## Fetch

1. The address in the **Program Counter (PC)** is copied into the **Memory Address Register (MAR)**.
2. The PC is incremented, so it already points at the next instruction.
3. The address in the MAR is sent along the **address bus** to RAM.
4. The instruction at that address comes back along the **data bus** into the **Memory Data Register (MDR)**.
5. The instruction is copied into the **Current Instruction Register (CIR)**.

> [!EXAM]
> A common mistake is to say the PC "goes to memory". It doesn't: its value is *copied to the MAR*, and the MAR is what is connected to the address bus.

## Decode

The **Control Unit** splits the instruction in the CIR into an **opcode** (`LDA`, what to do) and an **operand** (`5`, what to do it to).

## Execute

For `LDA 5`, the operand `5` goes into the MAR, the value at address 5 is fetched into the MDR, and it is then copied into the **Accumulator (ACC)**.

For `ADD 6`, the **ALU** does the arithmetic, adding the value from memory to the ACC and storing the result back in the ACC.

## Try it

Scroll through the simulator and, at every step, say out loud which register changes and why. If you can explain all 29 steps, you can answer any fetch–decode–execute question on the paper.
