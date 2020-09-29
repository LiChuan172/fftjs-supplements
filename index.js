import { zip } from "ramda"
const { sqrt, floor } = Math

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
  const resolution = N / fs
  return resultFFT.map((value, index) => {
    const f = floor(index / 2) * resolution
    return f >= f1 && f <= f2 ? value : 0
  })
}
