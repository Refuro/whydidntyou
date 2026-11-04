// Two-phase tableau simplex: maximize c*x subject to A*x <= b and x >= 0.
// Deterministic index tie-breaking; infeasible/unbounded/budget outcomes fail closed.
export function simplex(A,b,c,{maxPivots=10000,epsilon=1e-9}={}){
  const m=b.length,n=c.length,B=Array.from({length:m},(_,i)=>n+i),N=Array.from({length:n+1},(_,j)=>j);
  const D=Array.from({length:m+2},()=>Array(n+2).fill(0));let pivots=0;
  if(A.length!==m||A.some(r=>r.length!==n)||[...A.flat(),...b,...c].some(x=>!Number.isFinite(x)))throw new Error('invalid LP');
  for(let i=0;i<m;i++){for(let j=0;j<n;j++)D[i][j]=A[i][j];D[i][n]=-1;D[i][n+1]=b[i];}
  for(let j=0;j<n;j++)D[m][j]=-c[j];N[n]=-1;D[m+1][n]=1;
  const pivot=(r,s)=>{
    if(++pivots>maxPivots)throw new Error('LP pivot budget exhausted');
    const inverse=1/D[r][s];
    for(let i=0;i<m+2;i++)if(i!==r)for(let j=0;j<n+2;j++)if(j!==s)D[i][j]-=D[r][j]*D[i][s]*inverse;
    for(let j=0;j<n+2;j++)if(j!==s)D[r][j]*=inverse;
    for(let i=0;i<m+2;i++)if(i!==r)D[i][s]*=-inverse;
    D[r][s]=inverse;[B[r],N[s]]=[N[s],B[r]];
  };
  const phase=number=>{
    const row=number===1?m+1:m;
    for(;;){
      let s=-1;
      for(let j=0;j<=n;j++)if(!(number===2&&N[j]===-1)&&(s<0||D[row][j]<D[row][s]-epsilon||Math.abs(D[row][j]-D[row][s])<=epsilon&&N[j]<N[s]))s=j;
      if(D[row][s]>=-epsilon)return true;
      let r=-1;
      for(let i=0;i<m;i++)if(D[i][s]>epsilon&&(r<0||D[i][n+1]/D[i][s]<D[r][n+1]/D[r][s]-epsilon||Math.abs(D[i][n+1]/D[i][s]-D[r][n+1]/D[r][s])<=epsilon&&B[i]<B[r]))r=i;
      if(r<0)return false;pivot(r,s);
    }
  };
  try{
    let r=0;for(let i=1;i<m;i++)if(D[i][n+1]<D[r][n+1])r=i;
    if(m&&D[r][n+1]<-epsilon){
      pivot(r,n);if(!phase(1)||D[m+1][n+1]<-epsilon||Math.abs(D[m+1][n+1])>epsilon)return {status:'infeasible',pivots};
      for(let i=0;i<m;i++)if(B[i]===-1){let s=0;for(let j=1;j<=n;j++)if(D[i][j]<D[i][s]-epsilon||Math.abs(D[i][j]-D[i][s])<=epsilon&&N[j]<N[s])s=j;if(Math.abs(D[i][s])>epsilon)pivot(i,s);}
    }
    if(!phase(2))return {status:'unbounded',pivots};
    const x=Array(n).fill(0);for(let i=0;i<m;i++)if(B[i]>=0&&B[i]<n)x[B[i]]=Math.max(0,D[i][n+1]);
    if(A.some((row,i)=>row.reduce((sum,a,j)=>sum+a*x[j],0)>b[i]+1e-7))return {status:'numerical-failure',pivots};
    return {status:'optimal',x,value:D[m][n+1],pivots};
  }catch(error){return {status:'budget-exhausted',pivots,reason:error.message};}
}
