"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/shared/loader";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmModal } from "@/components/shared/confirm-modal";

import { useListCategories } from "./api/use-list-categories";
import { useListExercises } from "./api/use-list-exercises";
import { useCreateCategory } from "./api/use-create-category";
import { useCreateExercise } from "./api/use-create-exercise";
import { useDeleteCategories } from "./api/use-delete-categories";
import { useDeleteExercises } from "./api/use-delete-exercises";
import { ExercisesSearchInput } from "./exercises-search";
import { useExercisesSearch } from "./hooks/use-exercises-search";

import type { IExercise } from "@/app/api/exercises/types";

export const Exercises = () => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newExerciseByCategory, setNewExerciseByCategory] = useState<
    Record<string, string>
  >({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(
    new Set()
  );
  const [deleteCategoryModal, setDeleteCategoryModal] = useState<{
    open: boolean;
    categoryId: string | null;
  }>({ open: false, categoryId: null });
  const [deleteExerciseModal, setDeleteExerciseModal] = useState<{
    open: boolean;
    exerciseId: string | null;
  }>({ open: false, exerciseId: null });
  const [deleteSelectedModalOpen, setDeleteSelectedModalOpen] = useState(false);

  const { data: categoriesData, isLoading: loadingCategories } =
    useListCategories();
  const { data: exercisesData, isLoading: loadingExercises } =
    useListExercises();

  const createCategory = useCreateCategory({
    onSuccess: () => setNewCategoryName(""),
    onError: (msg) => console.error(msg),
  });
  const createExercise = useCreateExercise({
    onError: (msg) => console.error(msg),
  });
  const deleteCategories = useDeleteCategories({
    onSuccess: () => {
      setSelectedCategoryIds(new Set());
      setSelectedExerciseIds(new Set());
    },
  });
  const deleteExercises = useDeleteExercises({
    onSuccess: () => setSelectedExerciseIds(new Set()),
  });

  const categories = useMemo(
    () => categoriesData?.categories ?? [],
    [categoriesData?.categories]
  );
  const exercises = useMemo(
    () => exercisesData?.exercises ?? [],
    [exercisesData?.exercises]
  );

  const exercisesByCategory = useMemo(() => {
    const map: Record<string, IExercise[]> = {};
    for (const ex of exercises) {
      if (!map[ex.category_id]) map[ex.category_id] = [];
      map[ex.category_id].push(ex);
    }
    return map;
  }, [exercises]);

  const {
    search,
    setSearch,
    searchLower,
    filteredCategories,
    expandedIds,
    toggleExpanded,
  } = useExercisesSearch({ categories, exercisesByCategory });

  const toggleCategorySelection = (id: string) => {
    const categoryExercises = exercisesByCategory[id] ?? [];

    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      const willSelect = !next.has(id);

      if (willSelect) {
        next.add(id);
      } else {
        next.delete(id);
      }

      setSelectedExerciseIds((prevExercises) => {
        const nextExercises = new Set(prevExercises);
        if (willSelect) {
          categoryExercises.forEach((ex) => nextExercises.add(ex.id));
        } else {
          categoryExercises.forEach((ex) => nextExercises.delete(ex.id));
        }
        return nextExercises;
      });

      return next;
    });
  };

  const toggleExerciseSelection = (id: string) => {
    setSelectedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    createCategory.mutate({ name });
  };

  const handleAddExercise = (categoryId: string) => {
    const name = (newExerciseByCategory[categoryId] ?? "").trim();
    if (!name) return;
    createExercise.mutate(
      { name, categoryId },
      {
        onSuccess: () =>
          setNewExerciseByCategory((prev) => ({ ...prev, [categoryId]: "" })),
      }
    );
  };

  const handleDeleteSelected = () => {
    const catIds = Array.from(selectedCategoryIds);
    const exIds = Array.from(selectedExerciseIds);
    if (catIds.length > 0) deleteCategories.mutate(catIds);
    if (exIds.length > 0) deleteExercises.mutate(exIds);
    setDeleteSelectedModalOpen(false);
  };

  const handleConfirmDeleteCategory = () => {
    if (deleteCategoryModal.categoryId) {
      deleteCategories.mutate([deleteCategoryModal.categoryId]);
      setDeleteCategoryModal({ open: false, categoryId: null });
    }
  };

  const handleConfirmDeleteExercise = () => {
    if (deleteExerciseModal.exerciseId) {
      deleteExercises.mutate([deleteExerciseModal.exerciseId]);
      setDeleteExerciseModal({ open: false, exerciseId: null });
    }
  };

  const hasSelection =
    selectedCategoryIds.size > 0 || selectedExerciseIds.size > 0;
  const isDeleting = deleteCategories.isPending || deleteExercises.isPending;

  if (loadingCategories || loadingExercises) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex flex-col gap-2 border-b-2 border-destructive pb-4">
        <ExercisesSearchInput value={search} onChange={setSearch} />
      </div>

      <div className="flex flex-col gap-2 max-w-sm">
        <Input
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          className="w-full"
        />
        <Button
          size="sm"
          className="w-full"
          onClick={handleAddCategory}
          variant="outline"
          disabled={!newCategoryName.trim() || createCategory.isPending}
        >
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      {hasSelection && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteSelectedModalOpen(true)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          Delete selected ({selectedCategoryIds.size + selectedExerciseIds.size}
          )
        </Button>
      )}

      <div className="border rounded-lg divide-y bg-card">
        {filteredCategories.length === 0 ? (
          <div className="p-4 text-muted-foreground text-sm">
            {categories.length === 0
              ? "Add a category above or add an exercise using the input above (it will go to the default category)."
              : "No categories or exercises match your search."}
          </div>
        ) : (
          filteredCategories.map(({ category, exercises: catExercises }) => {
            const isExpanded = expandedIds.has(category.id);
            const isCategorySelected = selectedCategoryIds.has(category.id);

            return (
              <div key={category.id} className="flex flex-col">
                <div
                  className="flex items-center gap-2 p-3 hover:bg-muted/50 cursor-pointer min-h-12"
                  onClick={() => toggleExpanded(category.id)}
                >
                  <Checkbox
                    checked={isCategorySelected}
                    onCheckedChange={() => toggleCategorySelection(category.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  <span className="font-medium flex-1">{category.name}</span>
                  {catExercises.length > 0 && (
                    <span className="text-muted-foreground text-sm">
                      {catExercises.length}
                    </span>
                  )}
                  {category.name.toLowerCase() !== "other" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteCategoryModal({
                          open: true,
                          categoryId: category.id,
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isExpanded && (
                  <div className="pl-10 pr-3 pb-3 pt-0 space-y-2 bg-muted/20">
                    {catExercises.map((ex) => {
                      const isExSelected = selectedExerciseIds.has(ex.id);
                      const isMatch =
                        searchLower &&
                        ex.name.toLowerCase().includes(searchLower);
                      return (
                        <div
                          key={ex.id}
                          className={`flex items-center gap-2 py-1.5 pl-2 rounded hover:bg-muted/50 ${
                            isMatch ? "border-b bg-muted/50 rounded-lg" : ""
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isExSelected}
                            onCheckedChange={() =>
                              toggleExerciseSelection(ex.id)
                            }
                          />
                          <span className="flex-1">{ex.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteExerciseModal({
                                open: true,
                                exerciseId: ex.id,
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                    <div
                      className="flex items-center gap-2 pt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        placeholder="New exercise in this category"
                        value={newExerciseByCategory[category.id] ?? ""}
                        onChange={(e) =>
                          setNewExerciseByCategory((prev) => ({
                            ...prev,
                            [category.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddExercise(category.id);
                        }}
                        className="flex-1 max-w-full h-8"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => handleAddExercise(category.id)}
                        disabled={
                          !(newExerciseByCategory[category.id] ?? "").trim() ||
                          createExercise.isPending
                        }
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {hasSelection && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteSelectedModalOpen(true)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          Delete selected ({selectedCategoryIds.size + selectedExerciseIds.size}
          )
        </Button>
      )}

      <ConfirmModal
        open={deleteCategoryModal.open}
        onOpenChange={(open) =>
          !open && setDeleteCategoryModal({ open: false, categoryId: null })
        }
        title="Delete category?"
        description="This will permanently delete this category and all exercises in it. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteCategory}
        isPending={deleteCategories.isPending}
      />

      <ConfirmModal
        open={deleteExerciseModal.open}
        onOpenChange={(open) =>
          !open && setDeleteExerciseModal({ open: false, exerciseId: null })
        }
        title="Delete exercise?"
        description="This will permanently delete this exercise. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteExercise}
        isPending={deleteExercises.isPending}
      />

      <ConfirmModal
        open={deleteSelectedModalOpen}
        onOpenChange={setDeleteSelectedModalOpen}
        title="Delete selected?"
        description="This will permanently delete the selected categories and exercises. Categories will be deleted with all their exercises. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteSelected}
        isPending={isDeleting}
      />
    </div>
  );
};
