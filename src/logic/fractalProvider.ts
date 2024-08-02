import { type Fractal } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isBrowser } from "~/components/browserUtils";
import { api } from "~/utils/api";

export const loadFractalRangesFromLocalStorage = () => JSON.parse(localStorage.getItem('fractalCache') ?? '[]') as Fractal[][];

export default function useFractalProvider(setSelectedFractal: (fractal: Fractal | null) => void) {
  const [limit, setLimit] = useState(50);
  const [isInitial, setIsInitial] = useState(true);
  const [ranges, setRanges] = useState<Fractal[][]>(isBrowser ? loadFractalRangesFromLocalStorage() : []);
  
  const setAndSaveRanges = useCallback((newRanges: Fractal[][]) => {
    setRanges(newRanges);
    localStorage.setItem('fractalCache', JSON.stringify(newRanges));
  }, []);
  
  const input = isInitial ? { gt: ranges[0]?.[0]?.id ?? 0 } : { gt: ranges[1]?.[0]?.id, lt: ranges[0]?.at(-1)?.id };
  const opts = isInitial ? {} : {enabled: limit > (ranges[0]?.length ?? 0) && ranges[0]?.at(-1)?.id !== 1};
  
  const { data: newData, isFetching } = api.fractal.findMany.useQuery(input, opts);
  
  useEffect(() => {
    if (newData === undefined) return;
    
    const newDataLengthBelowLimit = newData.length < 50;
    
    if (!isInitial) {
      if (!ranges[0]) throw Error('Invalid cache on non-initial fetch');
      ranges[0] = [...ranges[0], ...newData];
      setAndSaveRanges(ranges[1] && newDataLengthBelowLimit ?
        [[...ranges[0], ...ranges[1]], ...ranges.slice(2)] :
        [...ranges]
      );  
    }

    if (isInitial) {
      setIsInitial(false);
      setAndSaveRanges(ranges[0] && newDataLengthBelowLimit ?
        [[...newData, ...ranges[0]], ...ranges.slice(1)] :
        [[...newData], ...ranges]
      );
    }
  }, [newData, isInitial, ranges, setAndSaveRanges]);

  const fractals = useMemo(() => ranges[0]?.slice(0, limit) ?? [], [limit, ranges]);

  const loadMore = useCallback(() => {
    if (!isFetching && fractals?.at(-1)?.id !== 1) setLimit(limit + 50);
  }, [fractals, limit, isFetching]);

  const { mutate: uploadFractal } = api.fractalMutate.create.useMutation({
    onSuccess: newFractal => {
      setAndSaveRanges([[newFractal, ...ranges[0] ?? []], ...ranges.slice(1)]);
      setSelectedFractal(newFractal);
    }
  });

  const { mutate: deleteFractal } = api.fractalMutate.delete.useMutation({
    onSuccess: deletedFractal => {
      setSelectedFractal(null);
      setAndSaveRanges([[...(ranges[0] ?? []).filter(fractal => fractal.id !== deletedFractal.id)], ...ranges.slice(1)]);
    },
  });

  return { fractals, loadMore, uploadFractal, deleteFractal };
}