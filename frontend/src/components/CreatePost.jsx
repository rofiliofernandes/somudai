import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { readFileAsDataURL } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setPosts } from '@/redux/postSlice';

const CreatePost = ({ open, setOpen }) => {
  const imageRef = useRef();

  // NEW: Post type state
  const [postType, setPostType] = useState("image"); // "image" or "text"

  const [file, setFile] = useState("");
  const [caption, setCaption] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useSelector(store => store.auth);
  const { posts } = useSelector(store => store.post);
  const dispatch = useDispatch();

 const fileChangeHandler = async (e) => {
  const selectedFile = e.target.files?.[0];
  if (!selectedFile) return;

  // ❌ Block videos
  if (!selectedFile.type.startsWith("image/")) {
    toast.error("Only image files are allowed (no videos)");
    e.target.value = null;
    return;
  }

  // ❌ Block large images (5 MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (selectedFile.size > maxSize) {
    toast.error("Image size must be under 5MB");
    e.target.value = null;
    return;
  }

  // ✅ Allowed formats
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(selectedFile.type)) {
    toast.error("Only JPG, PNG, or WEBP images allowed");
    e.target.value = null;
    return;
  }

  setFile(selectedFile);
  const dataUrl = await readFileAsDataURL(selectedFile);
  setImagePreview(dataUrl);
};


  
  const createPostHandler = async () => {
    const formData = new FormData();

    formData.append("type", postType);

    if (postType === "text") {
      // Text post → send caption as "text"
      formData.append("text", caption);
    } else {
      // Image post → caption + file
      formData.append("caption", caption);
      if (!file) {
        return toast.error("Please select an image");
      }
      formData.append("image", file);
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "https://instaclone-g9h5.onrender.com/api/v1/post/addpost",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true
        }
      );

      if (res.data.success) {
        dispatch(setPosts([res.data.post, ...posts]));
        toast.success(res.data.message);
        setOpen(false);
      }

    } catch (error) {
      toast.error(error.response?.data?.message || "Error occurred");

    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={() => setOpen(false)}>
        <DialogHeader className="text-center font-semibold">
          Create New Post
        </DialogHeader>

        {/* ------------------ USER INFO ------------------ */}
        <div className="flex gap-3 items-center">
          <Avatar>
            <AvatarImage src={user?.profilePicture} alt="img" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-xs">{user?.username}</h1>
            <span className="text-gray-600 text-xs">Bio here...</span>
          </div>
        </div>

        {/* ------------------ POST TYPE TOGGLE ------------------ */}
        <div className="flex gap-3 my-3">
          <Button
            variant={postType === "text" ? "default" : "outline"}
            onClick={() => {
              setPostType("text");
              setImagePreview("");
              setFile("");
            }}
          >
            Text Post
          </Button>

          <Button
            variant={postType === "image" ? "default" : "outline"}
            onClick={() => setPostType("image")}
          >
            Image Post
          </Button>
        </div>

        {/* ------------------ CAPTION / TEXT INPUT ------------------ */}
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="focus-visible:ring-transparent border-none"
          placeholder={
            postType === "text"
              ? "Write your text post (max 280 chars)..."
              : "Write a caption..."
          }
          maxLength={postType === "text" ? 280 : undefined}
        />

        {postType === "text" && (
          <p className="text-right text-xs text-gray-500">
            {caption.length}/280
          </p>
        )}

        {/* ------------------ IMAGE PREVIEW ------------------ */}
        {postType === "image" && imagePreview && (
          <div className="w-full h-64 flex items-center justify-center">
            <img
              src={imagePreview}
              alt="preview_img"
              className="object-cover h-full w-full rounded-md"
            />
          </div>
        )}

        {/* ------------------ FILE INPUT FOR IMAGE POST ------------------ */}
        {postType === "image" && (
          <>
            <input
              ref={imageRef}
              type="file"
              className="hidden"
              onChange={fileChangeHandler}
            />

            <Button
              onClick={() => imageRef.current.click()}
              className="w-fit mx-auto bg-[#0095F6] hover:bg-[#258bcf]"
            >
              Select from computer
            </Button>
          </>
        )}

        {/* ------------------ SUBMIT BUTTON ------------------ */}
        {loading ? (
          <Button disabled className="w-full mt-3">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait
          </Button>
        ) : (
          <Button onClick={createPostHandler} className="w-full mt-3">
            Post
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePost;

