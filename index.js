import pkg from "ramda"
const {zip} = pkg
import FFT from "fft.js"
const { sqrt, floor, log2, ceil } = Math
// const { zip } = ramda

export function getReals(complex) {
  return complex.filter((_, index) => index % 2 === 0)
}

export function getImaginarys(complex) {
  return complex.filter((_, index) => index % 2 === 1)
}

export function getComplexes(reals, imaginarys) {
  return Array(reals.length * 2)
    .fill(0)
    .map((_, index) =>
      index % 2 === 0
        ? reals[index / 2]
        : imaginarys[(index - 1) / 2]
    )
}

export function absComplex(real, imaginary) {
  return sqrt(real * real + imaginary * imaginary)
}

// translate FFT to DFT, the length of DFT will be the half of the FFT
export function toDFT(resultFFT) {
  const reals = getReals(resultFFT)
  const imaginarys = getImaginarys(resultFFT)
  const N = reals.length
  const [realsDFT, imaginarysDFT] = [reals, imaginarys].map(
    (data) =>
      Array(N / 2)
        .fill(0)
        .map(
          (_, index) =>
            data[index] / (N / (index === 0 ? 1 : 2))
        )
  )

  return getComplexes(realsDFT, imaginarysDFT)
}

// translate DFT to Amplitude Spectrum
export function toAmplitudeSpectrum(resultDFT) {
  const reals = getReals(resultDFT)
  const imaginarys = getImaginarys(resultDFT)
  return zip(reals, imaginarys).map((complex) =>
    absComplex(...complex)
  )
}

// AS stands for amplitude spectrum
// fs stands for frequency of sampling
export function addFrequecyOnAS(resultAS, fs) {
  const N = resultAS.length * 2
  const resolution = N / fs
  return resultAS.map((amp, index) => [
    resolution * index,
    amp,
  ])
}

// FS stands for frequency spectrum
// fb stands for base frequency
export function orderSpectrum(resultFS, fb) {
  return resultFS.map(([f, a]) => [f / fb, a])
}

export function throughBandPass(resultFFT, fs, f1, f2) {
  const N = resultFFT.length / 2
  const resolution =  fs / N
  return resultFFT.map((value, index) => {
    const f = floor(index / 2) * resolution
    return f >= f1 && f <= f2 ? value : 0
  })
}

// cut the length, for example, from 1088 to 1024
export function cutSample(sample) {
  const len = sample.length
  const lenCut = 2 ** floor(log2(len))
  return sample.slice(0, lenCut)
}

// expand the length, for example, from 1088 to 2048
export function expandSample(sample) {
  const len = sample.length
  const lenExpand = 2 ** ceil(log2(len))
  return sample.concat(Array(lenExpand - len).fill(0))
}


// cut sample and get fft result
export function getResFft(sample) {
  // cut sample down
  const sampleCut = cutSample(sample)

  // get a fft instance
  const n = sampleCut.length
  const f = new FFT(n)

  // get a complex sample
  const sampleCutComplex = f.createComplexArray()
  f.toComplexArray(sampleCut, sampleCutComplex)

  // get fft result: resFft
  const resFft = f.createComplexArray()
  f.transform(resFft, sampleCutComplex)

  return { resFft, f, n }
}

// sample through bandpass
// sample: original sample,
// fs: sampling frequency,
// f1: min value of the pass,
// f2: max vaule of the pass
export function sampleThroughBandpass(sample, fs, f1, f2) {
  // cut sample and get fft result
  const { resFft, f, n } = getResFft(sample)

  // fft result through bandpass
  const resThroughBandPass = throughBandPass(resFft, fs, f1, f2)
  f.completeSpectrum(resThroughBandPass)

  // inverse fft
  const sampleComplex = f.createComplexArray()
  f.inverseTransform(sampleComplex, resThroughBandPass)

  // get the real part of the complex sample
  const sampleReal = Array(n).fill(0)
  f.fromComplexArray(sampleComplex, sampleReal)

  return sampleReal
}

export function amplitudeSpectrum(sample) {
  // cut sample and get fft result
  const { resFft } = getResFft(sample)

  // translate FFT to DFT
  const resDFT = toDFT(resFft)

  // translate DFT to Amplitude Spectrum
  const AS = toAmplitudeSpectrum(resDFT)

  return AS
}

export function ASThroughBandpass(sample, fs, f1, f2) {
  // cut sample and get fft result
  const { resFft } = getResFft(sample)

  const resFftTP = throughBandPass(resFft, fs, f1, f2)

  // translate FFT to DFT
  const resDFT = toDFT(resFftTP)

  // translate DFT to Amplitude Spectrum
  const AS = toAmplitudeSpectrum(resDFT)

  return AS
}